import prisma from "@/lib/prisma";
import { number, object, string } from "yup";
import { os, protectedOS } from "./context";

// Create payment schema
const createPaymentSchema = object({
  billId: string().required("Bill ID is required"),
  amount: number()
    .required("Amount is required")
    .positive("Amount must be positive"),
  paymentMethod: string().required("Payment method is required"),
  transactionId: string().optional().nullable(),
  notes: string().optional().nullable(),
});

// Create payment and update bill
export const createPayment = protectedOS
  .route({
    method: "POST",
    path: "/payments",
    summary: "Create a payment and update bill status",
  })
  .input(createPaymentSchema)
  .handler(async ({ input, context }) => {
    // Get bill details
    const bill = await prisma.bills.findUnique({
      where: { id: input.billId },
      include: {
        appointment: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    // Security check: Prevent payment on already paid bills
    if (bill.status === "PAID") {
      throw new Error("Already Paid");
    }

    // Validate payment amount
    if (input.amount > bill.dueAmount) {
      throw new Error(
        `Payment amount (${input.amount}) cannot exceed due amount (${bill.dueAmount})`,
      );
    }

    // Transaction: Create payment + Update bill + Log event
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payments.create({
        data: {
          billId: input.billId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          initiatedBy: context.user.id,
          transactionId: input.transactionId || null,
          notes: input.notes || null,
          status: "success",
        },
      });

      // 2. Update bill
      const newPaidAmount = bill.paidAmount + input.amount;
      const newDueAmount = bill.dueAmount - input.amount;
      const newStatus =
        newDueAmount === 0
          ? "PAID"
          : newDueAmount < bill.totalAmount
            ? "PARTIAL"
            : "PENDING";

      const updatedBill = await tx.bills.update({
        where: { id: input.billId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus,
        },
      });

      return { payment, bill: updatedBill };
    });

    return result;
  });

// Get bill with payments
export const getBillWithPayments = os
  .route({
    method: "GET",
    path: "/bills/:id/payments",
    summary: "Get bill details with payment history",
  })
  .input(
    object({
      id: string().required(),
    }),
  )
  .handler(async ({ input }) => {
    const bill = await prisma.bills.findUnique({
      where: { id: input.id },
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
            queuePosition: true,
            appointmentDate: true,
            status: true,
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
        billItems: {
          select: {
            id: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
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
