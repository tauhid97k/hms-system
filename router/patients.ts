import prisma from "@/lib/prisma";
import { getPaginationQuery } from "@/lib/pagination";
import { paginationSchema } from "@/schema/paginationSchema";
import { createPatientSchema, updatePatientSchema } from "@/schema/patientSchema";
import { os } from "@orpc/server";
import { object, string } from "yup";

// Helper function to generate next patient ID with race condition handling
// Format: PID25-000001 (PID + Year + 6-digit sequential)
// Can handle 999,999 patients per year
async function generatePatientId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits of year
  const prefix = `PID${yearSuffix}-`;

  // Use transaction with retry logic to handle race conditions
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      // Find the last patient ID for current year
      const lastPatient = await prisma.patients.findFirst({
        where: {
          patientId: {
            startsWith: prefix,
          },
        },
        orderBy: { patientId: "desc" },
        select: { patientId: true },
      });

      let nextSequential = 1;

      if (lastPatient) {
        // Extract the sequential number from the last patient ID
        const lastSequential = parseInt(lastPatient.patientId.split("-")[1]);
        nextSequential = lastSequential + 1;
      }

      // Format: PID25-000001
      const newPatientId = `${prefix}${nextSequential.toString().padStart(6, "0")}`;

      // Check if this ID already exists (race condition check)
      const existing = await prisma.patients.findFirst({
        where: { patientId: newPatientId },
      });

      if (!existing) {
        return newPatientId;
      }

      // If exists, retry
      attempts++;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique patient ID after multiple attempts");
      }
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error("Failed to generate unique patient ID");
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
      })
    )
  )
  .handler(async ({ input }) => {
    const { skip, take } = getPaginationQuery(input);

    // Build where clause
    const where: any = {};

    // Search filter (name, phone, patientId)
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { phone: { contains: input.search } },
        { patientId: { contains: input.search } },
      ];
    }

    // Gender filter
    if (input.gender && input.gender !== "all") {
      where.gender = input.gender;
    }

    // Blood group filter
    if (input.bloodGroup && input.bloodGroup !== "all") {
      where.bloodGroup = input.bloodGroup;
    }

    // Active filter
    if (input.isActive && input.isActive !== "all") {
      where.isActive = input.isActive === "true";
    }

    const [patients, total] = await Promise.all([
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
        visits: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        bills: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            visits: true,
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
export const createPatient = os
  .route({
    method: "POST",
    path: "/patients",
    summary: "Create a new patient",
  })
  .input(createPatientSchema)
  .handler(async ({ input }) => {
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
    }).concat(updatePatientSchema)
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
            visits: true,
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
      patient._count.visits + patient._count.bills + patient._count.documents;

    if (totalAssociations > 0) {
      throw new Error(
        `Cannot delete patient. Patient has ${totalAssociations} associated records (visits, bills, or documents). Please remove them first or deactivate the patient instead.`
      );
    }

    await prisma.patients.delete({
      where: { id: input },
    });

    return { success: true, message: "Patient deleted successfully" };
  });
