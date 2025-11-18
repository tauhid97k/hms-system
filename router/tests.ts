import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { paginationSchema } from "@/schema/paginationSchema";
import { testSchema } from "@/schema/testSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";
import { Prisma } from "../prisma/generated/client";

// Get all tests (with pagination and filters)
export const getTests = os
  .route({
    method: "GET",
    path: "/tests",
    summary: "Get all tests",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().default(""),
        isActive: string().oneOf(["true", "false", "all"]).default("all"),
        labId: string().optional(),
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    // Build where clause
    const where: Prisma.test_typesWhereInput = {};

    // Search filter
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ];
    }

    // Active filter
    if (input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    // Lab filter
    if (input.labId) {
      where.labId = input.labId;
    }

    const [tests, total] = await prisma.$transaction([
      prisma.test_types.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          lab: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.test_types.count({ where }),
    ]);

    return {
      data: tests,
      meta: {
        page,
        limit,
        total,
      },
    };
  });

// Create test
export const createTest = os
  .route({
    method: "POST",
    path: "/tests",
    summary: "Create a new test",
  })
  .input(testSchema)
  .handler(async ({ input }) => {
    const test = await prisma.test_types.create({
      data: {
        name: input.name,
        code: input.code,
        price: input.price,
        description: input.description,
        labId: input.labId,
        isActive: input.isActive,
      },
    });
    return test;
  });

// Update test
export const updateTest = os
  .route({
    method: "PUT",
    path: "/tests/:id",
    summary: "Update a test",
  })
  .input(
    testSchema.concat(
      object({
        id: string().required(),
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { id, ...rest } = input;
    const test = await prisma.test_types.update({
      where: { id },
      data: {
        name: rest.name,
        code: rest.code,
        price: rest.price,
        description: rest.description,
        labId: rest.labId,
        isActive: rest.isActive,
      },
    });
    return test;
  });

// Toggle test status
export const toggleTestStatus = os
  .route({
    method: "PATCH",
    path: "/tests/:id/toggle-status",
    summary: "Toggle test active status",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const test = await prisma.test_types.findUnique({
      where: { id: input },
    });

    if (!test) {
      throw new Error("Test not found");
    }

    const updated = await prisma.test_types.update({
      where: { id: input },
      data: { isActive: !test.isActive },
    });

    return updated;
  });

// Delete test
export const deleteTest = os
  .route({
    method: "DELETE",
    path: "/tests/:id",
    summary: "Delete a test",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const test = await prisma.test_types.delete({
      where: { id: input },
    });
    return test;
  });
