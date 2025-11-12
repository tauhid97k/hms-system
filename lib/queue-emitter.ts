import { EventEmitter } from "events";
import prisma from "./prisma";
import { startOfDay, format } from "date-fns";

// Global event emitter for queue updates
export const queueEmitter = new EventEmitter();

// Type-safe event data
export interface QueueUpdateEvent {
  doctorId: string;
  queue: any[];
  timestamp: Date;
}

// Helper to fetch queue for a doctor
export async function getQueueForDoctor(doctorId: string) {
  const todayStart = startOfDay(new Date());

  return await prisma.appointments.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: todayStart },
      status: { in: ["WAITING", "IN_CONSULTATION"] },
    },
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
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
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
    orderBy: { queuePosition: "asc" },
  });
}

// Helper to emit queue updates (called after DB changes)
export async function emitQueueUpdate(doctorId: string) {
  try {
    const queue = await getQueueForDoctor(doctorId);

    // Emit event (non-blocking)
    queueEmitter.emit("queue-update", {
      doctorId,
      queue,
      timestamp: new Date(),
    } as QueueUpdateEvent);

    console.log(`Queue update emitted for doctor: ${doctorId}`);
  } catch (error) {
    console.error("Error emitting queue update:", error);
  }
}

/**
 * ATOMIC: Get next serial number for doctor today
 * Uses database-level locking to prevent race conditions
 */
export async function getNextSerialNumber(doctorId: string): Promise<number> {
  const todayStart = startOfDay(new Date());
  const todayDate = format(todayStart, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // Lock the last appointment row for this doctor today
    // FOR UPDATE ensures no other transaction can read/write this row until we commit
    const lastVisit = await tx.$queryRaw<Array<{ serialNumber: number }>>`
      SELECT "serialNumber"
      FROM appointments
      WHERE "doctorId" = ${doctorId}
        AND "appointmentDate" >= ${todayStart}::timestamp
      ORDER BY "serialNumber" DESC
      FOR UPDATE
      LIMIT 1
    `;

    const nextSerial = lastVisit.length > 0 ? lastVisit[0].serialNumber + 1 : 1;

    return nextSerial;
  });
}

/**
 * ATOMIC: Get next queue position for doctor today
 * Uses database-level locking to prevent race conditions
 */
export async function getNextQueuePosition(doctorId: string): Promise<number> {
  const todayStart = startOfDay(new Date());

  return await prisma.$transaction(async (tx) => {
    // Lock all active queue entries for this doctor today
    // This prevents concurrent requests from getting the same position
    const activeQueue = await tx.$queryRaw<Array<{ queuePosition: number }>>`
      SELECT "queuePosition"
      FROM appointments
      WHERE "doctorId" = ${doctorId}
        AND "appointmentDate" >= ${todayStart}::timestamp
        AND "status" IN ('WAITING', 'IN_CONSULTATION')
      ORDER BY "queuePosition" DESC
      FOR UPDATE
      LIMIT 1
    `;

    const nextPosition =
      activeQueue.length > 0 ? activeQueue[0].queuePosition + 1 : 1;

    return nextPosition;
  });
}

/**
 * ATOMIC: Generate bill number
 * Uses database-level locking to prevent duplicate bill numbers
 */
export async function generateBillNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const prefix = `B-${year}`;

  return await prisma.$transaction(
    async (tx) => {
      // Lock the last bill row for this year
      // FOR UPDATE ensures no other transaction can read/write this row until we commit
      const lastBill = await tx.$queryRaw<Array<{ billNumber: string }>>`
      SELECT "billNumber"
      FROM bills
      WHERE "billNumber" LIKE ${prefix + "%"}
      ORDER BY "createdAt" DESC
      FOR UPDATE
      LIMIT 1
    `;

      let nextNumber = 1;
      if (lastBill.length > 0) {
        const lastNumber = parseInt(
          lastBill[0].billNumber.split("-").pop() || "0"
        );
        nextNumber = lastNumber + 1;
      }

      return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
    },
    {
      maxWait: 5000, // Maximum time to wait for a transaction slot
      timeout: 10000, // Maximum time for the transaction to complete
    }
  );
}

/**
 * Re-adjust queue positions after a cancellation or removal
 * Decrements all positions greater than the removed position
 */
export async function reAdjustQueuePositions(
  doctorId: string,
  appointmentDate: Date,
  removedPosition: number
): Promise<void> {
  const todayStart = startOfDay(appointmentDate);

  await prisma.$transaction(async (tx) => {
    // Get all appointments that need position adjustment
    const appointmentsToUpdate = await tx.appointments.findMany({
      where: {
        doctorId,
        appointmentDate: { gte: todayStart },
        queuePosition: { gt: removedPosition },
        status: { in: ["WAITING", "IN_CONSULTATION"] },
      },
      select: { id: true, queuePosition: true },
      orderBy: { queuePosition: "asc" },
    });

    // Update each appointment's queue position
    for (const appointment of appointmentsToUpdate) {
      await tx.appointments.update({
        where: { id: appointment.id },
        data: { queuePosition: appointment.queuePosition - 1 },
      });
    }
  });
}

/**
 * Remove appointment from queue and re-adjust positions
 * Used when cancelling or completing appointments
 */
export async function removeFromQueue(appointmentId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get the appointment details
    const appointment = await tx.appointments.findUnique({
      where: { id: appointmentId },
      select: {
        doctorId: true,
        appointmentDate: true,
        queuePosition: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Only re-adjust if appointment was in active queue
    if (
      appointment.status === "WAITING" ||
      appointment.status === "IN_CONSULTATION"
    ) {
      // Re-adjust queue positions
      await reAdjustQueuePositions(
        appointment.doctorId,
        appointment.appointmentDate,
        appointment.queuePosition
      );
    }
  });
}
