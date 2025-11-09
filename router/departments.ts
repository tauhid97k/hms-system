import prisma from "@/lib/prisma"
import { getPaginationQuery } from "@/lib/pagination"
import { paginationSchema } from "@/schema/paginationSchema"
import { createDepartmentSchema, updateDepartmentSchema } from "@/schema/departmentSchema"
import { os } from "@orpc/server"
import { object, string } from "yup"

// Get all departments with pagination
export const getDepartments = os
  .route({
    method: "GET",
    path: "/departments",
    summary: "Get all departments",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().optional(),
        isActive: string().optional(), // "true" | "false" | "all"
      })
    )
  )
  .handler(async ({ input }) => {
    const { skip, take } = getPaginationQuery(input)

    // Build where clause
    const where: any = {}

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { code: { contains: input.search, mode: "insensitive" } },
      ]
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true"
    }

    const [departments, total] = await Promise.all([
      prisma.departments.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.departments.count({ where }),
    ])

    return {
      data: departments,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
      },
    }
  })

// Get single department by ID
export const getDepartment = os
  .route({
    method: "GET",
    path: "/departments/:id",
    summary: "Get department by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const department = await prisma.departments.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            users: true,
            doctors: true,
            labs: true,
          },
        },
      },
    })

    if (!department) {
      throw new Error("Department not found")
    }

    return department
  })

// Create department
export const createDepartment = os
  .route({
    method: "POST",
    path: "/departments",
    summary: "Create a new department",
  })
  .input(createDepartmentSchema)
  .handler(async ({ input }) => {
    // Check if department with same name or code already exists
    const existing = await prisma.departments.findFirst({
      where: {
        OR: [{ name: input.name }, { code: input.code }],
      },
    })

    if (existing) {
      if (existing.name === input.name) {
        throw new Error("Department with this name already exists")
      }
      if (existing.code === input.code) {
        throw new Error("Department with this code already exists")
      }
    }

    const department = await prisma.departments.create({
      data: {
        name: input.name,
        code: input.code.toUpperCase(), // Ensure uppercase
        description: input.description,
        isActive: input.isActive ?? true,
      },
    })

    return department
  })

// Update department
export const updateDepartment = os
  .route({
    method: "PUT",
    path: "/departments",
    summary: "Update a department",
  })
  .input(
    object({
      id: string().required(),
    }).concat(updateDepartmentSchema)
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input

    // Check if department exists
    const existing = await prisma.departments.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error("Department not found")
    }

    // Check for name/code conflicts with other departments
    if (data.name || data.code) {
      const conflict = await prisma.departments.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.name ? { name: data.name } : {},
                data.code ? { code: data.code } : {},
              ].filter((obj) => Object.keys(obj).length > 0),
            },
          ],
        },
      })

      if (conflict) {
        if (conflict.name === data.name) {
          throw new Error("Department with this name already exists")
        }
        if (conflict.code === data.code) {
          throw new Error("Department with this code already exists")
        }
      }
    }

    // Ensure code is uppercase if provided
    const updateData = { ...data }
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase()
    }

    const department = await prisma.departments.update({
      where: { id },
      data: updateData,
    })

    return department
  })

// Delete department
export const deleteDepartment = os
  .route({
    method: "DELETE",
    path: "/departments/:id",
    summary: "Delete a department",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            users: true,
            doctors: true,
            labs: true,
          },
        },
      },
    })

    if (!department) {
      throw new Error("Department not found")
    }

    // Check if department has any associations
    const totalAssociations =
      department._count.users + department._count.doctors + department._count.labs

    if (totalAssociations > 0) {
      throw new Error(
        `Cannot delete department. It has ${totalAssociations} associated records (users, doctors, or labs). Please reassign or remove them first.`
      )
    }

    await prisma.departments.delete({
      where: { id: input },
    })

    return { success: true, message: "Department deleted successfully" }
  })

// Toggle department active status
export const toggleDepartmentStatus = os
  .route({
    method: "PATCH",
    path: "/departments/:id/toggle-status",
    summary: "Toggle department active status",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const department = await prisma.departments.findUnique({
      where: { id: input },
    })

    if (!department) {
      throw new Error("Department not found")
    }

    const updated = await prisma.departments.update({
      where: { id: input },
      data: { isActive: !department.isActive },
    })

    return updated
  })
