import prisma from "@/lib/prisma";
import { getPaginationQuery } from "@/lib/pagination";
import { paginationSchema } from "@/schema/paginationSchema";
import { createSpecializationSchema, updateSpecializationSchema } from "@/schema/specializationSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";

// Get all specializations with pagination
export const getSpecializations = os
  .route({
    method: "GET",
    path: "/specializations",
    summary: "Get all specializations",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().optional(),
        isActive: string().optional(), // "true" | "false" | "all"
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take } = getPaginationQuery(input);

    // Build where clause
    const where: any = {};

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { code: { contains: input.search, mode: "insensitive" } },
      ];
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    const [specializations, total] = await Promise.all([
      prisma.specializations.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              employeeSpecializations: true,
            },
          },
        },
      }),
      prisma.specializations.count({ where }),
    ]);

    return {
      data: specializations,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
      },
    };
  });

// Get single specialization by ID
export const getSpecialization = os
  .route({
    method: "GET",
    path: "/specializations/:id",
    summary: "Get specialization by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const specialization = await prisma.specializations.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            employeeSpecializations: true,
          },
        },
      },
    });

    if (!specialization) {
      throw new Error("Specialization not found");
    }

    return specialization;
  });

// Create specialization
export const createSpecialization = os
  .route({
    method: "POST",
    path: "/specializations",
    summary: "Create a new specialization",
  })
  .input(createSpecializationSchema)
  .handler(async ({ input }) => {
    // Check if specialization with same name or code already exists
    const existing = await prisma.specializations.findFirst({
      where: {
        OR: [{ name: input.name }, { code: input.code }],
      },
    });

    if (existing) {
      if (existing.name === input.name) {
        throw new Error("Specialization with this name already exists");
      }
      if (existing.code === input.code) {
        throw new Error("Specialization with this code already exists");
      }
    }

    const specialization = await prisma.specializations.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description || null,
        isActive: input.isActive ?? true,
      },
    });

    return specialization;
  });

// Update specialization
export const updateSpecialization = os
  .route({
    method: "PUT",
    path: "/specializations",
    summary: "Update a specialization",
  })
  .input(
    object({
      id: string().required(),
    }).concat(updateSpecializationSchema),
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;

    // Check if specialization exists
    const existing = await prisma.specializations.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Specialization not found");
    }

    // Check for name/code conflicts
    if (data.name || data.code) {
      const conflict = await prisma.specializations.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.code ? [{ code: data.code }] : []),
              ],
            },
          ],
        },
      });

      if (conflict) {
        if (conflict.name === data.name) {
          throw new Error("Specialization with this name already exists");
        }
        if (conflict.code === data.code) {
          throw new Error("Specialization with this code already exists");
        }
      }
    }

    const specialization = await prisma.specializations.update({
      where: { id },
      data,
    });

    return specialization;
  });

// Delete specialization
export const deleteSpecialization = os
  .route({
    method: "DELETE",
    path: "/specializations/:id",
    summary: "Delete a specialization",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    // Check if specialization exists
    const specialization = await prisma.specializations.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            employeeSpecializations: true,
          },
        },
      },
    });

    if (!specialization) {
      throw new Error("Specialization not found");
    }

    // Check if specialization is being used
    if (specialization._count.employeeSpecializations > 0) {
      throw new Error(
        `Cannot delete specialization. ${specialization._count.employeeSpecializations} employee(s) have this specialization. Please remove them first or deactivate the specialization instead.`,
      );
    }

    await prisma.specializations.delete({
      where: { id: input },
    });

    return { success: true, message: "Specialization deleted successfully" };
  });

// Toggle specialization status
export const toggleSpecializationStatus = os
  .route({
    method: "PATCH",
    path: "/specializations/:id/toggle-status",
    summary: "Toggle specialization active status",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const specialization = await prisma.specializations.findUnique({
      where: { id: input },
    });

    if (!specialization) {
      throw new Error("Specialization not found");
    }

    const updated = await prisma.specializations.update({
      where: { id: input },
      data: { isActive: !specialization.isActive },
    });

    return updated;
  });
