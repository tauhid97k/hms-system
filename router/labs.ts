import prisma from "@/lib/prisma";
import { os } from "@orpc/server";

// Get all labs (simple list for dropdowns)
export const getLabs = os
  .route({
    method: "GET",
    path: "/labs",
    summary: "Get all labs",
  })
  .handler(async () => {
    const labs = await prisma.labs.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });

    return labs;
  });
