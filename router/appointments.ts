import prisma from "@/lib/prisma";
import {
  emitQueueUpdate,
  generateBillNumber,
  getNextQueuePosition,
  getNextSerialNumber,
  getQueueForDoctor,
  removeFromQueue,
} from "@/lib/queue-emitter";
import {
  callNextPatientSchema,
  createAppointmentSchema,
  createAppointmentWithNewPatientSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from "@/schema/appointmentSchema";
import { os } from "@orpc/server";
import { format } from "date-fns";
import { number, object, string } from "yup";
import {
  AppointmentEventType,
  AppointmentStatus,
  AppointmentType,
  Prisma,
} from "../prisma/generated/client";

// Get all appointments with pagination and filters
export const getAppointments = os
  .route({
    method: "GET",
    path: "/appointments",
    summary: "Get all appointments",
  })
  .input(
    object({
      page: number().default(1).min(1),
      limit: number().default(10).min(1).max(100),
      patientId: string().optional(),
      doctorId: string().optional(),
      status: string()
        .oneOf(["WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"])
        .optional(),
      appointmentDate: string().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const { page, limit, patientId, doctorId, status, appointmentDate } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.appointmentsWhereInput = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status as AppointmentStatus;
    if (appointmentDate) {
      const date = new Date(appointmentDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      where.appointmentDate = { gte: startOfDay, lte: endOfDay };
    }

    const [appointments, total] = await prisma.$transaction([
      prisma.appointments.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              name: true,
              age: true,
              gender: true,
              phone: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { appointmentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.appointments.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        page,
        limit,
        total,
      },
    };
  });

// Get appointment by ID (basic details only - optimized)
export const getAppointment = os
  .route({
    method: "GET",
    path: "/appointments/:id",
    summary: "Get appointment by ID (basic details)",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const appointment = await prisma.appointments.findUnique({
      where: { id: input },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            age: true,
            gender: true,
            phone: true,
            bloodGroup: true,
          },
        },
        doctor: {
          select: {
            id: true,
            consultationFee: true,
            hospitalFee: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedByEmployee: {
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
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    return appointment;
  });

// Get appointment bills (separate endpoint for better performance)
export const getAppointmentBills = os
  .route({
    method: "GET",
    path: "/appointments/:id/bills",
    summary: "Get bills for an appointment",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const bills = await prisma.bills.findMany({
      where: { appointmentId: input },
      include: {
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
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bills;
  });

// Get appointment events (paginated for performance)
export const getAppointmentEvents = os
  .route({
    method: "GET",
    path: "/appointments/:id/events",
    summary: "Get events for an appointment (paginated)",
  })
  .input(
    object({
      id: string().required(),
      page: number().default(1).min(1),
      limit: number().default(20).min(1).max(100),
    }),
  )
  .handler(async ({ input }) => {
    const skip = (input.page - 1) * input.limit;

    const [events, total] = await prisma.$transaction([
      prisma.appointment_events.findMany({
        where: { appointmentId: input.id },
        include: {
          performedByEmployee: {
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
        orderBy: { performedAt: "asc" },
        skip,
        take: input.limit,
      }),
      prisma.appointment_events.count({ where: { appointmentId: input.id } }),
    ]);

    return {
      data: events,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  });

// Get appointment prescriptions (separate endpoint)
export const getAppointmentPrescriptions = os
  .route({
    method: "GET",
    path: "/appointments/:id/prescriptions",
    summary: "Get prescriptions for an appointment",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const prescriptions = await prisma.prescriptions.findMany({
      where: { appointmentId: input },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                genericName: true,
                strength: true,
                type: true,
                manufacturer: true,
              },
            },
            instruction: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return prescriptions;
  });

// Create appointment with auto-billing
export const createAppointment = os
  .route({
    method: "POST",
    path: "/appointments",
    summary: "Create a new appointment",
  })
  .input(createAppointmentSchema)
  .handler(async ({ input }) => {
    // Get doctor fees
    const doctor = await prisma.employees.findUnique({
      where: { id: input.doctorId },
      select: {
        consultationFee: true,
        hospitalFee: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get next serial number and queue position
    const serialNumber = await getNextSerialNumber(input.doctorId);
    const queuePosition = await getNextQueuePosition(input.doctorId);
    const appointmentMonth = format(new Date(), "yyyy-MM");

    // Transaction: Create appointment + bill + events
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create appointment
      const appointment = await tx.appointments.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          assignedBy: input.assignedBy,
          appointmentType: input.appointmentType as AppointmentType,
          chiefComplaint: input.chiefComplaint,
          serialNumber,
          queuePosition,
          status: AppointmentStatus.WAITING,
          appointmentDate: new Date(),
          appointmentMonth,
        },
      });

      // 2. Auto-generate bill
      const consultationFee = doctor.consultationFee || 0;
      const hospitalFee = doctor.hospitalFee || 0;
      const totalFee = consultationFee + hospitalFee;

      const billNumber = await generateBillNumber();

      const bill = await tx.bills.create({
        data: {
          billNumber,
          patientId: input.patientId,
          appointmentId: appointment.id,
          billableType: "appointment",
          billableId: appointment.id,
          totalAmount: totalFee,
          dueAmount: totalFee,
          paidAmount: 0,
          status: "PENDING",
          billingDate: new Date(),
        },
      });

      // 3. Create bill item
      await tx.bill_items.create({
        data: {
          billId: bill.id,
          itemableType: "consultation",
          itemableId: appointment.id,
          itemName: `Consultation - ${doctor.user.name}`,
          quantity: 1,
          unitPrice: totalFee,
          total: totalFee,
        },
      });

      // 4. Log events
      await tx.appointment_events.createMany({
        data: [
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.APPOINTMENT_REGISTERED,
            performedBy: input.assignedBy,
            description: "Appointment registered",
          },
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.QUEUE_JOINED,
            performedBy: input.assignedBy,
            description: `Joined queue at position ${queuePosition}`,
          },
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.CONSULTATION_BILLED,
            performedBy: input.assignedBy,
            description: `Billed ${totalFee}`,
            metadata: {
              billId: bill.id,
              amount: totalFee,
              billNumber,
            },
          },
        ],
      });

      return { appointment, bill };
    });

    // Emit queue update (non-blocking)
    await emitQueueUpdate(input.doctorId);

    return result.appointment;
  });

// Create appointment with new patient (simplified registration)
export const createAppointmentWithNewPatient = os
  .route({
    method: "POST",
    path: "/appointments/with-new-patient",
    summary: "Create appointment with new patient registration",
  })
  .input(createAppointmentWithNewPatientSchema)
  .handler(async ({ input }) => {
    // Get doctor fees
    const doctor = await prisma.employees.findUnique({
      where: { id: input.doctorId },
      select: {
        consultationFee: true,
        hospitalFee: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get next serial number and queue position
    const serialNumber = await getNextSerialNumber(input.doctorId);
    const queuePosition = await getNextQueuePosition(input.doctorId);
    const appointmentMonth = format(new Date(), "yyyy-MM");

    // Check if patient with same phone already exists
    const existingPatient = await prisma.patients.findFirst({
      where: { phone: input.patientPhone },
    });

    if (existingPatient) {
      throw new Error("Patient with this phone number already exists");
    }

    // Generate patient ID with proper format and locking
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    const prefix = `PID${yearSuffix}-`;

    // Transaction: Create patient + appointment + bill + events
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate patient ID with database-level locking
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
        const lastSequential = parseInt(lastPatient[0].patientId.split("-")[1]);
        nextSequential = lastSequential + 1;
      }

      const patientId = `${prefix}${nextSequential.toString().padStart(6, "0")}`;

      // 2. Create patient with simplified fields
      const patient = await tx.patients.create({
        data: {
          patientId,
          name: input.patientName,
          phone: input.patientPhone,
          age: input.patientAge,
          gender: input.patientGender as "MALE" | "FEMALE" | "OTHER",
          isActive: true,
        },
      });

      // 3. Create appointment
      const appointment = await tx.appointments.create({
        data: {
          patientId: patient.id,
          doctorId: input.doctorId,
          assignedBy: input.assignedBy,
          appointmentType: input.appointmentType as AppointmentType,
          chiefComplaint: input.chiefComplaint,
          serialNumber,
          queuePosition,
          status: AppointmentStatus.WAITING,
          appointmentDate: new Date(),
          appointmentMonth,
        },
      });

      // 4. Auto-generate bill
      const consultationFee = doctor.consultationFee || 0;
      const hospitalFee = doctor.hospitalFee || 0;
      const totalFee = consultationFee + hospitalFee;

      const billNumber = await generateBillNumber();

      const bill = await tx.bills.create({
        data: {
          billNumber,
          patientId: patient.id,
          appointmentId: appointment.id,
          billableType: "appointment",
          billableId: appointment.id,
          totalAmount: totalFee,
          dueAmount: totalFee,
          paidAmount: 0,
          status: "PENDING",
          billingDate: new Date(),
        },
      });

      // 5. Create bill item
      await tx.bill_items.create({
        data: {
          billId: bill.id,
          itemableType: "consultation",
          itemableId: appointment.id,
          itemName: `Consultation - ${doctor.user.name}`,
          quantity: 1,
          unitPrice: totalFee,
          total: totalFee,
        },
      });

      // 6. Log events
      await tx.appointment_events.createMany({
        data: [
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.APPOINTMENT_REGISTERED,
            performedBy: input.assignedBy,
            description: "Appointment registered with new patient",
          },
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.QUEUE_JOINED,
            performedBy: input.assignedBy,
            description: `Joined queue at position ${queuePosition}`,
          },
          {
            appointmentId: appointment.id,
            eventType: AppointmentEventType.CONSULTATION_BILLED,
            performedBy: input.assignedBy,
            description: `Billed ${totalFee}`,
            metadata: {
              billId: bill.id,
              amount: totalFee,
              billNumber,
            },
          },
        ],
      });

      return { patient, appointment, bill };
    });

    // Emit queue update (non-blocking)
    await emitQueueUpdate(input.doctorId);

    return {
      appointment: result.appointment,
      patient: result.patient,
      patientId: result.patient.patientId,
    };
  });

// Update appointment status
export const updateAppointmentStatus = os
  .route({
    method: "PATCH",
    path: "/appointments/:id/status",
    summary: "Update appointment status",
  })
  .input(updateAppointmentStatusSchema)
  .handler(async ({ input }) => {
    // Update appointment
    const appointment = await prisma.appointments.update({
      where: { id: input.id },
      data: {
        status: input.status as AppointmentStatus,
        ...(input.status === "IN_CONSULTATION" && { entryTime: new Date() }),
        ...(input.status === "COMPLETED" && { exitTime: new Date() }),
      },
    });

    // Map status to event type
    const eventTypeMap: Record<string, AppointmentEventType> = {
      IN_CONSULTATION: AppointmentEventType.ENTERED_ROOM,
      COMPLETED: AppointmentEventType.CONSULTATION_COMPLETED,
      CANCELLED: AppointmentEventType.APPOINTMENT_CANCELLED,
    };

    const eventType = eventTypeMap[input.status];

    // Log event
    if (eventType) {
      await prisma.appointment_events.create({
        data: {
          appointmentId: input.id,
          eventType: eventType,
          performedBy: input.performedBy,
          description: `Status changed to ${input.status}`,
        },
      });
    }

    // If appointment is cancelled or completed, remove from queue and re-adjust positions
    if (input.status === "CANCELLED" || input.status === "COMPLETED") {
      await removeFromQueue(input.id);
    }

    // Emit queue update
    await emitQueueUpdate(appointment.doctorId);

    return appointment;
  });

// Call next patient
export const callNextPatient = os
  .route({
    method: "POST",
    path: "/appointments/queue/call-next",
    summary: "Call next patient in queue",
  })
  .input(callNextPatientSchema)
  .handler(async ({ input }) => {
    // Get next waiting patient
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const nextAppointment = await prisma.appointments.findFirst({
      where: {
        doctorId: input.doctorId,
        appointmentDate: { gte: todayStart },
        status: "WAITING",
      },
      orderBy: { queuePosition: "asc" },
    });

    if (!nextAppointment) {
      throw new Error("No patients waiting");
    }

    // Update status
    const updated = await prisma.appointments.update({
      where: { id: nextAppointment.id },
      data: {
        status: AppointmentStatus.IN_CONSULTATION,
        entryTime: new Date(),
      },
    });

    // Log event
    await prisma.appointment_events.create({
      data: {
        appointmentId: updated.id,
        eventType: AppointmentEventType.QUEUE_CALLED,
        performedBy: input.performedBy,
        description: "Patient called from queue",
      },
    });

    // Emit queue update
    await emitQueueUpdate(input.doctorId);

    return updated;
  });

// Update appointment (diagnosis, complaint, etc.)
export const updateAppointment = os
  .route({
    method: "PUT",
    path: "/appointments",
    summary: "Update appointment details",
  })
  .input(updateAppointmentSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;

    const appointment = await prisma.appointments.update({
      where: { id },
      data: {
        ...(data.chiefComplaint !== undefined && {
          chiefComplaint: data.chiefComplaint,
        }),
        ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
        ...(data.status && { status: data.status as AppointmentStatus }),
      },
    });

    // If status changed, emit queue update
    if (data.status) {
      await emitQueueUpdate(appointment.doctorId);
    }

    return appointment;
  });

// Get queue for a specific doctor
export const getQueue = os
  .route({
    method: "GET",
    path: "/appointments/queue/:doctorId",
    summary: "Get queue for a specific doctor",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    return await getQueueForDoctor(input);
  });
