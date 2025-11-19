import { getPaginationQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { paginationSchema } from "@/schema/paginationSchema";
import {
  createPatientSchema,
  updatePatientSchema,
} from "@/schema/patientSchema";
import { object, string } from "yup";
import { BloodGroup, Gender, Prisma } from "../prisma/generated/client";
import { os, protectedOS } from "./context";

// Helper function to generate next patient ID with database-level locking
// Format: PID25-000001 (PID + Year + 6-digit sequential)
// Can handle 999,999 patients per year
async function generatePatientId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits of year
  const prefix = `PID${yearSuffix}-`;

  return await prisma.$transaction(async (tx) => {
    // Lock the last patient row for this year using FOR UPDATE
    // This prevents race conditions when multiple requests try to generate IDs simultaneously
    const lastPatient = await tx.$queryRaw<Array<{ patientId: string }>>`
      SELECT "patientId"
      FROM patients
      WHERE "patientId" LIKE ${prefix + "%"}
      ORDER BY "patientId" DESC
      FOR UPDATE
      LIMIT 1
    `;

    let nextSequential = 1;

    if (lastPatient.length > 0) {
      // Extract the sequential number from the last patient ID
      const lastSequential = parseInt(lastPatient[0].patientId.split("-")[1]);
      nextSequential = lastSequential + 1;
    }

    // Format: PID25-000001
    return `${prefix}${nextSequential.toString().padStart(6, "0")}`;
  });
}

// Get all patients with pagination
export const getPatients = os
  .route({
    method: "GET",
    path: "/patients",
    summary: "Get all patients",
  })
  .input(
    paginationSchema.concat(
      object({
        search: string().optional(),
        gender: string().optional(),
        bloodGroup: string().optional(),
        isActive: string().optional(), // "true" | "false" | "all"
      }),
    ),
  )
  .handler(async ({ input }) => {
    const { skip, take } = getPaginationQuery(input);

    // Build where clause
    const where: Prisma.patientsWhereInput = {};

    // Search filter (name, phone, patientId)
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" as const } },
        { phone: { contains: input.search } },
        { patientId: { contains: input.search } },
      ];
    }

    // Gender filter
    if (input.gender && input.gender !== "all") {
      where.gender = input.gender as Gender;
    }

    // Blood group filter
    if (input.bloodGroup && input.bloodGroup !== "all") {
      where.bloodGroup = input.bloodGroup as BloodGroup;
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    const [patients, total] = await prisma.$transaction([
      prisma.patients.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patients.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
      },
    };
  });

// Get single patient by ID
export const getPatient = os
  .route({
    method: "GET",
    path: "/patients/:id",
    summary: "Get patient by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const patient = await prisma.patients.findUnique({
      where: { id: input },
      include: {
        appointments: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        bills: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            appointments: true,
            documents: true,
            bills: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    return patient;
  });

// Create patient
export const createPatient = protectedOS
  .route({
    method: "POST",
    path: "/patients",
    summary: "Create a new patient",
  })
  .input(createPatientSchema)
  .handler(async ({ input, context }) => {
    // Check if patient with same phone already exists
    const existing = await prisma.patients.findFirst({
      where: { phone: input.phone },
    });

    if (existing) {
      throw new Error("Patient with this phone number already exists");
    }

    // Generate patient ID
    const patientId = await generatePatientId();

    const patient = await prisma.patients.create({
      data: {
        patientId,
        name: input.name,
        age: input.age,
        phone: input.phone,
        gender: input.gender || null,
        bloodGroup: input.bloodGroup || null,
        email: input.email || null,
        address: input.address || null,
        notes: input.notes || null,
        isActive: input.isActive ?? true,
        initiatedBy: context.user.id,
      },
    });

    return patient;
  });

// Update patient
export const updatePatient = os
  .route({
    method: "PUT",
    path: "/patients",
    summary: "Update a patient",
  })
  .input(
    object({
      id: string().required(),
    }).concat(updatePatientSchema),
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;

    // Check if patient exists
    const existing = await prisma.patients.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Patient not found");
    }

    // Check for phone conflicts with other patients
    if (data.phone) {
      const conflict = await prisma.patients.findFirst({
        where: {
          AND: [{ id: { not: id } }, { phone: data.phone }],
        },
      });

      if (conflict) {
        throw new Error("Patient with this phone number already exists");
      }
    }

    const patient = await prisma.patients.update({
      where: { id },
      data,
    });

    return patient;
  });

// Delete patient
export const deletePatient = os
  .route({
    method: "DELETE",
    path: "/patients/:id",
    summary: "Delete a patient",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    // Check if patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            appointments: true,
            bills: true,
            documents: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Check if patient has any associations
    const totalAssociations =
      patient._count.appointments +
      patient._count.bills +
      patient._count.documents;

    if (totalAssociations > 0) {
      throw new Error(
        `Cannot delete patient. Patient has ${totalAssociations} associated records (appointments, bills, or documents). Please remove them first or deactivate the patient instead.`,
      );
    }

    await prisma.patients.delete({
      where: { id: input },
    });

    return { success: true, message: "Patient deleted successfully" };
  });
