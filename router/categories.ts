import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { categorySchema } from "@/schema/categorySchema";
import { paginationSchema } from "@/schema/paginationSchema";
import { os } from "@orpc/server";
import { string } from "yup";

// Get Categories
export const getCategories = os
  .route({
    method: "GET",
    path: "/categories",
    summary: "Get all categories",
  })
  .input(paginationSchema)
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    const [categories, total] = await prisma.$transaction([
      prisma.categories.findMany({
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.categories.count(),
    ]);

    return {
      data: categories,
      meta: {
        page,
        limit,
        total,
      },
    };
  });

// Create Category
export const createCategory = os
  .route({
    method: "POST",
    path: "/categories",
    summary: "Create a new category",
  })
  .input(categorySchema)
  .handler(async ({ input }) => {
    const category = await prisma.categories.create({
      data: input,
    });
    return category;
  });

// Delete Category
export const deleteCategory = os
  .route({
    method: "DELETE",
    path: "/categories/:id",
    summary: "Delete a category",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const category = await prisma.categories.delete({
      where: {
        id: input,
      },
    });
    return category;
  });
