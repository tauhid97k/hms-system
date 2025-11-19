import prisma from "@/lib/prisma";
import { os } from "@orpc/server";

// Get all active payment methods
export const getPaymentMethods = os
  .route({
    method: "GET",
    path: "/payment-methods",
    summary: "Get all active payment methods",
  })
  .handler(async () => {
    const paymentMethods = await prisma.payment_methods.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return paymentMethods;
  });
