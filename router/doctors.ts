import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { paginationSchema } from "@/schema/paginationSchema";
import { os } from "@orpc/server";
import { hashPassword } from "better-auth/crypto";
import { array, boolean, mixed, number, object, string } from "yup";

// Get all doctors (employees with doctor role)
export const getDoctors = os
  .route({
    method: "GET",
    path: "/doctors",
    summary: "Get all doctors",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().optional(),
        departmentId: string().optional(),
        specializationId: string().optional(),
        isAvailable: string().optional(), // "true" | "false" | "all"
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take } = getPaginationQuery(input);

    // Build AND conditions array
    const andConditions: Prisma.employeesWhereInput[] = [];

    // Search filter
    if (input.search) {
      andConditions.push({
        OR: [
          {
            user: {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            },
          },
          { qualification: { contains: input.search, mode: "insensitive" } },
        ],
      });
    }

    // Department filter
    if (input.departmentId && input.departmentId !== "all") {
      andConditions.push({
        employeeDepartments: {
          some: { departmentId: input.departmentId },
        },
      });
    }

    // Specialization filter
    if (input.specializationId && input.specializationId !== "all") {
      andConditions.push({
        employeeSpecializations: {
          some: { specializationId: input.specializationId },
        },
      });
    }

    // Availability filter
    if (input.isAvailable && input.isAvailable !== "all") {
      andConditions.push({
        isAvailable: input.isAvailable === "true",
      });
    }

    // Only get employees who are doctors (have consultation fee or are assigned to departments)
    andConditions.push({
      OR: [
        { consultationFee: { not: null } },
        { employeeDepartments: { some: {} } },
      ],
    });

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [doctors, total] = await Promise.all([
      prisma.employees.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            },
          },
          employeeDepartments: {
            include: {
              department: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          employeeSpecializations: {
            include: {
              specialization: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          _count: {
            select: {
              doctorAppointments: true,
            },
          },
        },
      }),
      prisma.employees.count({ where }),
    ]);

    return {
      data: doctors,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
      },
    };
  });

// Get single doctor by ID
export const getDoctor = os
  .route({
    method: "GET",
    path: "/doctors/:id",
    summary: "Get doctor by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const doctor = await prisma.employees.findUnique({
      where: { id: input },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        employeeDepartments: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        employeeSpecializations: {
          include: {
            specialization: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: {
            doctorAppointments: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return doctor;
  });

// Create doctor (user + employee in transaction)
export const createDoctor = os
  .route({
    method: "POST",
    path: "/doctors",
    summary: "Create a new doctor",
  })
  .input(
    object({
      // User fields
      name: string().required(),
      email: string().email().required(),
      password: string().required().min(8),
      phone: string().optional().nullable(),

      // Employee fields
      bio: string().optional().nullable(),
      qualification: string().optional().nullable(),
      consultationFee: number().required().min(0),
      hospitalFee: number().optional().min(0).default(0),
      isAvailable: boolean().optional().default(true),

      // Relationships
      departmentIds: array(string()).optional().default([]),
      specializationIds: array(string()).optional().default([]),

      // JSON fields
      experiences: mixed().optional().nullable(), // JSON
      certificates: mixed().optional().nullable(), // JSON
    }),
  )
  .handler(async ({ input }) => {
    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password and get doctor role in parallel BEFORE transaction
    const [hashedPassword, doctorRole] = await Promise.all([
      hashPassword(input.password),
      prisma.roles.findFirst({ where: { slug: "doctor" } }),
    ]);

    // Transaction: Create user + employee + relationships
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.users.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          phone: input.phone || null,
          isActive: true,
        },
      });

      // 2. Create employee profile
      const employee = await tx.employees.create({
        data: {
          userId: user.id,
          bio: input.bio || null,
          qualification: input.qualification || null,
          consultationFee: input.consultationFee,
          hospitalFee: input.hospitalFee ?? 0,
          isAvailable: input.isAvailable ?? true,
          experiences: input.experiences
            ? JSON.parse(JSON.stringify(input.experiences))
            : null,
          certificates: input.certificates
            ? JSON.parse(JSON.stringify(input.certificates))
            : null,
        },
      });

      // 3. Assign departments
      if (input.departmentIds && input.departmentIds.length > 0) {
        await tx.employee_departments.createMany({
          data: input.departmentIds
            .filter((id): id is string => !!id)
            .map((deptId, index) => ({
              employeeId: employee.id,
              departmentId: deptId,
              isPrimary: index === 0, // First one is primary
            })),
        });
      }

      // 4. Assign specializations
      if (input.specializationIds && input.specializationIds.length > 0) {
        await tx.employee_specializations.createMany({
          data: input.specializationIds
            .filter((id): id is string => !!id)
            .map((specId) => ({
              employeeId: employee.id,
              specializationId: specId,
            })),
        });
      }

      // 5. Assign doctor role (role fetched before transaction)
      if (doctorRole) {
        await tx.user_roles.create({
          data: {
            userId: user.id,
            roleId: doctorRole.id,
          },
        });
      }

      return { user, employee };
    });

    return result.employee;
  });

// Update doctor
export const updateDoctor = os
  .route({
    method: "PUT",
    path: "/doctors",
    summary: "Update a doctor",
  })
  .input(
    object({
      id: string().required(), // Employee ID

      // User fields (optional for update)
      name: string().optional(),
      email: string().email().optional(),
      phone: string().optional().nullable(),

      // Employee fields
      bio: string().optional().nullable(),
      qualification: string().optional().nullable(),
      consultationFee: number().optional().min(0),
      hospitalFee: number().optional().min(0),
      isAvailable: boolean().optional(),

      // Relationships
      departmentIds: array(string()).optional(),
      specializationIds: array(string()).optional(),

      // JSON fields
      experiences: mixed().optional().nullable(),
      certificates: mixed().optional().nullable(),
    }),
  )
  .handler(async ({ input }) => {
    const {
      id,
      departmentIds,
      specializationIds,
      name,
      email,
      phone,
      ...employeeData
    } = input;

    // Check if employee exists
    const existing = await prisma.employees.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new Error("Doctor not found");
    }

    // Check email conflict if changing email
    if (email) {
      const conflict = await prisma.users.findFirst({
        where: {
          AND: [{ id: { not: existing.userId } }, { email }],
        },
      });

      if (conflict) {
        throw new Error("User with this email already exists");
      }
    }

    // Transaction: Update user + employee + relationships
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update user if any user fields provided
      if (name || email || phone !== undefined) {
        await tx.users.update({
          where: { id: existing.userId },
          data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(phone !== undefined && { phone }),
          },
        });
      }

      // 2. Update employee
      await tx.employees.update({
        where: { id },
        data: {
          ...employeeData,
          experiences: employeeData.experiences
            ? JSON.parse(JSON.stringify(employeeData.experiences))
            : undefined,
          certificates: employeeData.certificates
            ? JSON.parse(JSON.stringify(employeeData.certificates))
            : undefined,
        },
      });

      // 3. ALWAYS update departments if provided (even if empty array)
      if (departmentIds !== undefined) {
        // Remove all existing
        await tx.employee_departments.deleteMany({
          where: { employeeId: id },
        });

        // Add new ones
        if (departmentIds.length > 0) {
          await tx.employee_departments.createMany({
            data: departmentIds
              .filter((deptId): deptId is string => !!deptId)
              .map((deptId, index) => ({
                employeeId: id,
                departmentId: deptId,
                isPrimary: index === 0,
              })),
          });
        }
      }

      // 4. ALWAYS update specializations if provided (even if empty array)
      if (specializationIds !== undefined) {
        // Remove all existing
        await tx.employee_specializations.deleteMany({
          where: { employeeId: id },
        });

        // Add new ones
        if (specializationIds.length > 0) {
          await tx.employee_specializations.createMany({
            data: specializationIds
              .filter((specId): specId is string => !!specId)
              .map((specId) => ({
                employeeId: id,
                specializationId: specId,
              })),
          });
        }
      }

      // Return updated employee with relationships
      return await tx.employees.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            },
          },
          employeeDepartments: {
            include: {
              department: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          employeeSpecializations: {
            include: {
              specialization: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          _count: {
            select: {
              doctorAppointments: true,
            },
          },
        },
      });
    });

    return updated;
  });

// Delete doctor
export const deleteDoctor = os
  .route({
    method: "DELETE",
    path: "/doctors/:id",
    summary: "Delete a doctor",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const employee = await prisma.employees.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            doctorAppointments: true,
          },
        },
      },
    });

    if (!employee) {
      throw new Error("Doctor not found");
    }

    // Check if doctor has visits
    if (employee._count.doctorAppointments > 0) {
      throw new Error(
        `Cannot delete doctor. Doctor has ${employee._count.doctorAppointments} associated visits. Please deactivate the doctor instead.`,
      );
    }

    // Transaction: Delete employee (user will be deleted via CASCADE)
    await prisma.$transaction(async (tx) => {
      // Delete employee (cascade will handle junction tables)
      await tx.employees.delete({
        where: { id: input },
      });

      // Delete user (cascade will handle sessions, accounts, etc.)
      await tx.users.delete({
        where: { id: employee.userId },
      });
    });

    return { success: true, message: "Doctor deleted successfully" };
  });

// Toggle doctor availability
export const toggleDoctorAvailability = os
  .route({
    method: "PATCH",
    path: "/doctors/:id/toggle-availability",
    summary: "Toggle doctor availability",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const employee = await prisma.employees.findUnique({
      where: { id: input },
    });

    if (!employee) {
      throw new Error("Doctor not found");
    }

    const updated = await prisma.employees.update({
      where: { id: input },
      data: { isAvailable: !employee.isAvailable },
    });

    return updated;
  });
