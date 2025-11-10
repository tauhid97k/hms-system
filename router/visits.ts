import prisma from "@/lib/prisma";
import { os } from "@orpc/server";
import { string, number, object } from "yup";
import {
  createVisitSchema,
  updateVisitSchema,
  updateVisitStatusSchema,
  callNextPatientSchema,
} from "@/schema/visitSchema";
import {
  emitQueueUpdate,
  getNextSerialNumber,
  getNextQueuePosition,
  generateBillNumber,
  getQueueForDoctor,
} from "@/lib/queue-emitter";
import { format } from "date-fns";
import { VisitType, VisitStatus, VisitEventType } from "prisma/generated/client";

// Get all visits with pagination and filters
export const getVisits = os
  .route({
    method: "GET",
    path: "/visits",
    summary: "Get all visits",
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
      visitDate: string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { page, limit, patientId, doctorId, status, visitDate } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (visitDate) {
      const date = new Date(visitDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      where.visitDate = { gte: startOfDay, lte: endOfDay };
    }

    const [visits, total] = await Promise.all([
      prisma.visits.findMany({
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
        orderBy: { visitDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.visits.count({ where }),
    ]);

    return {
      data: visits,
      meta: {
        page,
        limit,
        total,
      },
    };
  });

// Get visit by ID with full details
export const getVisit = os
  .route({
    method: "GET",
    path: "/visits/:id",
    summary: "Get visit by ID",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const visit = await prisma.visits.findUnique({
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
        visitEvents: {
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

    if (!visit) {
      throw new Error("Visit not found");
    }

    return visit;
  });

// Create visit with auto-billing
export const createVisit = os
  .route({
    method: "POST",
    path: "/visits",
    summary: "Create a new visit",
  })
  .input(createVisitSchema)
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
    const visitMonth = format(new Date(), "yyyy-MM");

    // Transaction: Create visit + bill + events
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create visit
      const visit = await tx.visits.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          assignedBy: input.assignedBy,
          visitType: input.visitType as VisitType,
          chiefComplaint: input.chiefComplaint,
          serialNumber,
          queuePosition,
          status: VisitStatus.WAITING,
          visitDate: new Date(),
          visitMonth,
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
          visitId: visit.id,
          billableType: "visit",
          billableId: visit.id,
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
          itemableId: visit.id,
          itemName: `Consultation - Dr. ${doctor.user.name}`,
          quantity: 1,
          unitPrice: totalFee,
          total: totalFee,
        },
      });

      // 4. Log events
      await tx.visit_events.createMany({
        data: [
          {
            visitId: visit.id,
            eventType: VisitEventType.VISIT_REGISTERED,
            performedBy: input.assignedBy,
            description: "Visit registered",
          },
          {
            visitId: visit.id,
            eventType: VisitEventType.QUEUE_JOINED,
            performedBy: input.assignedBy,
            description: `Joined queue at position ${queuePosition}`,
          },
          {
            visitId: visit.id,
            eventType: VisitEventType.CONSULTATION_BILLED,
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

      return { visit, bill };
    });

    // Emit queue update (non-blocking)
    await emitQueueUpdate(input.doctorId);

    return result.visit;
  });

// Update visit status
export const updateVisitStatus = os
  .route({
    method: "PATCH",
    path: "/visits/:id/status",
    summary: "Update visit status",
  })
  .input(updateVisitStatusSchema)
  .handler(async ({ input }) => {
    // Update visit
    const visit = await prisma.visits.update({
      where: { id: input.id },
      data: {
        status: input.status as VisitStatus,
        ...(input.status === "IN_CONSULTATION" && { entryTime: new Date() }),
        ...(input.status === "COMPLETED" && { exitTime: new Date() }),
      },
    });

    // Map status to event type
    const eventTypeMap: Record<string, VisitEventType> = {
      IN_CONSULTATION: VisitEventType.ENTERED_ROOM,
      COMPLETED: VisitEventType.CONSULTATION_COMPLETED,
      CANCELLED: VisitEventType.VISIT_CANCELLED,
    };

    const eventType = eventTypeMap[input.status];

    // Log event
    if (eventType) {
      await prisma.visit_events.create({
        data: {
          visitId: input.id,
          eventType: eventType,
          performedBy: input.performedBy,
          description: `Status changed to ${input.status}`,
        },
      });
    }

    // Emit queue update
    await emitQueueUpdate(visit.doctorId);

    return visit;
  });

// Call next patient
export const callNextPatient = os
  .route({
    method: "POST",
    path: "/visits/queue/call-next",
    summary: "Call next patient in queue",
  })
  .input(callNextPatientSchema)
  .handler(async ({ input }) => {
    // Get next waiting patient
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const nextVisit = await prisma.visits.findFirst({
      where: {
        doctorId: input.doctorId,
        visitDate: { gte: todayStart },
        status: "WAITING",
      },
      orderBy: { queuePosition: "asc" },
    });

    if (!nextVisit) {
      throw new Error("No patients waiting");
    }

    // Update status
    const updated = await prisma.visits.update({
      where: { id: nextVisit.id },
      data: {
        status: VisitStatus.IN_CONSULTATION,
        entryTime: new Date(),
      },
    });

    // Log event
    await prisma.visit_events.create({
      data: {
        visitId: updated.id,
        eventType: VisitEventType.QUEUE_CALLED,
        performedBy: input.performedBy,
        description: "Patient called from queue",
      },
    });

    // Emit queue update
    await emitQueueUpdate(input.doctorId);

    return updated;
  });

// Update visit (diagnosis, complaint, etc.)
export const updateVisit = os
  .route({
    method: "PUT",
    path: "/visits",
    summary: "Update visit details",
  })
  .input(updateVisitSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;

    const visit = await prisma.visits.update({
      where: { id },
      data: {
        ...(data.chiefComplaint !== undefined && {
          chiefComplaint: data.chiefComplaint,
        }),
        ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
        ...(data.status && { status: data.status as VisitStatus }),
      },
    });

    // If status changed, emit queue update
    if (data.status) {
      await emitQueueUpdate(visit.doctorId);
    }

    return visit;
  });

// Get queue for a specific doctor
export const getQueue = os
  .route({
    method: "GET",
    path: "/visits/queue/:doctorId",
    summary: "Get queue for a specific doctor",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    return await getQueueForDoctor(input);
  });
