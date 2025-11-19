import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { paginationSchema } from "@/schema/paginationSchema";
import { createPrescriptionSchema } from "@/schema/prescriptionSchema";
import { object, string } from "yup";
import { Prisma } from "../prisma/generated/client";
import { os, protectedOS } from "./context";

// Create prescription
export const createPrescription = protectedOS
  .route({
    method: "POST",
    path: "/prescriptions",
    summary: "Create a new prescription",
  })
  .input(createPrescriptionSchema)
  .handler(async ({ input, context }) => {
    // Check if appointment exists
    const appointment = await prisma.appointments.findUnique({
      where: { id: input.appointmentId },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await prisma.prescriptions.findFirst({
      where: { appointmentId: input.appointmentId },
    });

    if (existingPrescription) {
      throw new Error("Prescription already exists for this appointment");
    }

    // Check if appointment is in consultation status
    if (appointment.status !== "IN_CONSULTATION") {
      throw new Error("Can only prescribe for appointments in consultation");
    }

    // Create prescription with items in a transaction
    const prescription = await prisma.$transaction(async (tx) => {
      // Create prescription
      const newPrescription = await tx.prescriptions.create({
        data: {
          appointmentId: input.appointmentId,
          doctorId: input.doctorId,
          notes: input.notes,
          followUpDate: input.followUpDate,
          initiatedBy: context.user.id,
        },
      });

      // Create prescription items
      if (input.items && input.items.length > 0) {
        await tx.prescription_items.createMany({
          data: input.items.map((item) => ({
            prescriptionId: newPrescription.id,
            medicineId: item.medicineId,
            instructionId: item.instructionId,
            duration: item.duration,
            notes: item.notes,
          })),
        });
      }

      // Return prescription with items
      return tx.prescriptions.findUnique({
        where: { id: newPrescription.id },
        include: {
          items: {
            include: {
              medicine: true,
              instruction: true,
            },
          },
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });
    });

    return prescription;
  });

// Get prescription by appointment ID
export const getPrescriptionByAppointment = os
  .route({
    method: "GET",
    path: "/prescriptions/appointment/:appointmentId",
    summary: "Get prescription by appointment ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const prescription = await prisma.prescriptions.findFirst({
      where: { appointmentId: input },
      include: {
        items: {
          include: {
            medicine: true,
            instruction: true,
          },
        },
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    return prescription;
  });

// Get all prescriptions for a patient (with pagination)
export const getPrescriptionsByPatient = os
  .route({
    method: "GET",
    path: "/prescriptions/patient/:patientId",
    summary: "Get all prescriptions for a patient",
  })
  .input(
    paginationSchema.concat(
      object({
        patientId: string().required(),
        startDate: string().optional(),
        endDate: string().optional(),
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    // Build where clause
    const where: Prisma.prescriptionsWhereInput = {
      appointment: {
        patientId: input.patientId,
      },
    };

    // Date range filter
    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) {
        where.createdAt.gte = new Date(input.startDate);
      }
      if (input.endDate) {
        where.createdAt.lte = new Date(input.endDate);
      }
    }

    const [prescriptions, total] = await prisma.$transaction([
      prisma.prescriptions.findMany({
        where,
        skip,
        take,
        include: {
          items: {
            include: {
              medicine: true,
              instruction: true,
            },
          },
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentType: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prescriptions.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
