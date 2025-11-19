import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { labSchema } from "@/schema/labSchema";
import { paginationSchema } from "@/schema/paginationSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";
import { Prisma } from "../prisma/generated/client";

// Get all labs with pagination
export const getLabs = os
  .route({
    method: "GET",
    path: "/labs",
    summary: "Get all labs",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().optional(),
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    // Build where clause
    const where: Prisma.labsWhereInput = {};

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
        { code: { contains: input.search, mode: "insensitive" as const } },
      ];
    }

    const [labs, total] = await prisma.$transaction([
      prisma.labs.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.labs.count({ where }),
    ]);

    return {
      data: labs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

// Get lab by ID
export const getLab = os
  .route({
    method: "GET",
    path: "/labs/:id",
    summary: "Get lab by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const lab = await prisma.labs.findUnique({
      where: { id: input },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }

    return lab;
  });

// Create lab
export const createLab = os
  .route({
    method: "POST",
    path: "/labs",
    summary: "Create a new lab",
  })
  .input(labSchema)
  .handler(async ({ input }) => {
    const lab = await prisma.labs.create({
      data: {
        name: input.name,
        code: input.code,
        departmentId: input.departmentId || null,
        description: input.description || null,
      },
    });
    return lab;
  });

// Update lab
export const updateLab = os
  .route({
    method: "PATCH",
    path: "/labs/:id",
    summary: "Update a lab",
  })
  .input(
    object({
      id: string().required(),
    }).concat(labSchema),
  )
  .handler(async ({ input }) => {
    const lab = await prisma.labs.update({
      where: { id: input.id },
      data: {
        name: input.name,
        code: input.code,
        departmentId: input.departmentId || null,
        description: input.description || null,
      },
    });
    return lab;
  });

// Delete lab
export const deleteLab = os
  .route({
    method: "DELETE",
    path: "/labs/:id",
    summary: "Delete a lab",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const lab = await prisma.labs.delete({
      where: { id: input },
    });
    return lab;
  });
