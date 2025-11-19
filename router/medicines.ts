import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { medicineSchema } from "@/schema/medicineSchema";
import { paginationSchema } from "@/schema/paginationSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";
import { Prisma } from "../prisma/generated/client";

// Get all medicines with pagination
export const getMedicines = os
  .route({
    method: "GET",
    path: "/medicines",
    summary: "Get all medicines",
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
    const { skip, take, page, limit } = getPaginationQuery(input);

    // Build where clause
    const where: Prisma.medicinesWhereInput = {};

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
        {
          genericName: { contains: input.search, mode: "insensitive" as const },
        },
      ];
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    const [medicines, total] = await prisma.$transaction([
      prisma.medicines.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          genericName: true,
          type: true,
          manufacturer: true,
          strength: true,
          price: true,
          stock: true,
          minStock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.medicines.count({ where }),
    ]);

    return {
      data: medicines,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

// Get medicine by ID
export const getMedicine = os
  .route({
    method: "GET",
    path: "/medicines/:id",
    summary: "Get medicine by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const medicine = await prisma.medicines.findUnique({
      where: { id: input },
    });

    if (!medicine) {
      throw new Error("Medicine not found");
    }

    return medicine;
  });

// Create medicine
export const createMedicine = os
  .route({
    method: "POST",
    path: "/medicines",
    summary: "Create a new medicine",
  })
  .input(medicineSchema)
  .handler(async ({ input }) => {
    const medicine = await prisma.medicines.create({
      data: {
        name: input.name,
        genericName: input.genericName || null,
        type: input.type || null,
        manufacturer: input.manufacturer || null,
        strength: input.strength || null,
        price: input.price || null,
        stock: input.stock || null,
        minStock: input.minStock || null,
      },
    });
    return medicine;
  });

// Update medicine
export const updateMedicine = os
  .route({
    method: "PATCH",
    path: "/medicines/:id",
    summary: "Update a medicine",
  })
  .input(
    object({
      id: string().required(),
    }).concat(medicineSchema),
  )
  .handler(async ({ input }) => {
    const medicine = await prisma.medicines.update({
      where: { id: input.id },
      data: {
        name: input.name,
        genericName: input.genericName || null,
        type: input.type || null,
        manufacturer: input.manufacturer || null,
        strength: input.strength || null,
        price: input.price || null,
        stock: input.stock || null,
        minStock: input.minStock || null,
      },
    });
    return medicine;
  });

// Delete medicine
export const deleteMedicine = os
  .route({
    method: "DELETE",
    path: "/medicines/:id",
    summary: "Delete a medicine",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const medicine = await prisma.medicines.delete({
      where: { id: input },
    });
    return medicine;
  });
