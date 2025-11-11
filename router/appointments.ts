import prisma from "@/lib/prisma";
import { os } from "@orpc/server";
import { string, number, object } from "yup";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  callNextPatientSchema,
} from "@/schema/appointmentSchema";
import {
  emitQueueUpdate,
  getNextSerialNumber,
  getNextQueuePosition,
  generateBillNumber,
  getQueueForDoctor,
} from "@/lib/queue-emitter";
import { format } from "date-fns";
import { AppointmentType, AppointmentStatus, AppointmentEventType } from "../prisma/generated/client";

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
    })
  )
  .handler(async ({ input }) => {
    const { page, limit, patientId, doctorId, status, appointmentDate } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (appointmentDate) {
      const date = new Date(appointmentDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      where.appointmentDate = { gte: startOfDay, lte: endOfDay };
    }

    const [appointments, total] = await Promise.all([
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
              employeeDepartments: {
                include: {
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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

// Get appointment by ID with full details
export const getAppointment = os
  .route({
    method: "GET",
    path: "/appointments/:id",
    summary: "Get appointment by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const appointment = await prisma.appointments.findUnique({
      where: { id: input },
      include: {
        patient: true,
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
        assignedByEmployee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        bills: {
          include: {
            billItems: true,
            payments: true,
          },
        },
        prescriptions: {
          include: {
            items: {
              include: {
                medicine: true,
                instruction: true,
              },
            },
          },
        },
        appointmentEvents: {
          include: {
            performedByEmployee: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            performedAt: "asc",
          },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    return appointment;
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
          itemName: `Consultation - Dr. ${doctor.user.name}`,
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
