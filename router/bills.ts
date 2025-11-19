import prisma from "@/lib/prisma";
import { os } from "@orpc/server";
import { number, object, string } from "yup";
import { BillStatus, Prisma } from "../prisma/generated/client";

// Get all bills with pagination and filters
export const getBills = os
  .route({
    method: "GET",
    path: "/bills",
    summary: "Get all bills",
  })
  .input(
    object({
      page: number().default(1).min(1),
      limit: number().default(10).min(1).max(100),
      patientId: string().optional(),
      status: string()
        .oneOf(["PENDING", "PARTIAL", "PAID", "REFUNDED", "CANCELLED", "DUE"])
        .optional(),
      billableType: string().optional(),
      search: string().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const { page, limit, patientId, status, billableType, search } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.billsWhereInput = {};
    if (patientId) where.patientId = patientId;

    // Handle status filter
    if (status) {
      if (status === "DUE") {
        // DUE means bills with outstanding balance
        where.dueAmount = { gt: 0 };
      } else {
        where.status = status as BillStatus;
      }
    }

    if (billableType) where.billableType = billableType;

    // Search by bill number
    if (search) {
      where.billNumber = { contains: search, mode: "insensitive" as const };
    }

    const [bills, total] = await prisma.$transaction([
      prisma.bills.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              name: true,
              phone: true,
            },
          },
          appointment: {
            select: {
              id: true,
              serialNumber: true,
              appointmentType: true,
              doctor: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          billItems: true,
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              paymentDate: true,
              transactionId: true,
            },
          },
        },
        orderBy: { billingDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.bills.count({ where }),
    ]);

    return {
      data: bills,
      meta: {
        page,
        limit,
        total,
      },
    };
  });

// Get bill by ID with full details
export const getBill = os
  .route({
    method: "GET",
    path: "/bills/:id",
    summary: "Get bill by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const bill = await prisma.bills.findUnique({
      where: { id: input },
      include: {
        patient: true,
        appointment: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        billItems: true,
        payments: {
          include: {
            initiatedByUser: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    return bill;
  });

// Update bill status
export const updateBillStatus = os
  .route({
    method: "PATCH",
    path: "/bills/:id/status",
    summary: "Update bill status",
  })
  .input(
    object({
      id: string().required(),
      status: string()
        .oneOf(["PENDING", "PARTIAL", "PAID", "REFUNDED", "CANCELLED"])
        .required(),
    }),
  )
  .handler(async ({ input }) => {
    const bill = await prisma.bills.update({
      where: { id: input.id },
      data: {
        status: input.status as BillStatus,
      },
    });

    return bill;
  });
