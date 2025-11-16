import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { paginationSchema } from "@/schema/paginationSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";
import { Prisma } from "../prisma/generated/client";

// Get all medicine instructions with pagination
export const getMedicineInstructions = os
  .route({
    method: "GET",
    path: "/medicine-instructions",
    summary: "Get all medicine instructions",
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
    const where: Prisma.medicine_instructionsWhereInput = {};

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
        {
          description: { contains: input.search, mode: "insensitive" as const },
        },
      ];
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    const [instructions, total] = await prisma.$transaction([
      prisma.medicine_instructions.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      }),
      prisma.medicine_instructions.count({ where }),
    ]);

    return {
      data: instructions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
