import { EventEmitter } from "events";
import prisma from "./prisma";
import { startOfDay } from "date-fns";

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

  return await prisma.visits.findMany({
    where: {
      doctorId,
      visitDate: { gte: todayStart },
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

// Helper to get next serial number for doctor today
export async function getNextSerialNumber(doctorId: string): Promise<number> {
  const todayStart = startOfDay(new Date());

  const lastVisit = await prisma.visits.findFirst({
    where: {
      doctorId,
      visitDate: { gte: todayStart },
    },
    orderBy: { serialNumber: "desc" },
    select: { serialNumber: true },
  });

  return (lastVisit?.serialNumber || 0) + 1;
}

// Helper to get next queue position for doctor today
export async function getNextQueuePosition(
  doctorId: string,
): Promise<number> {
  const todayStart = startOfDay(new Date());

  const count = await prisma.visits.count({
    where: {
      doctorId,
      visitDate: { gte: todayStart },
      status: { in: ["WAITING", "IN_CONSULTATION"] },
    },
  });

  return count + 1;
}

// Helper to generate bill number
export async function generateBillNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();

  // Get last bill number for this year
  const lastBill = await prisma.bills.findFirst({
    where: {
      billNumber: { startsWith: `B-${year}` },
    },
    orderBy: { createdAt: "desc" },
    select: { billNumber: true },
  });

  let nextNumber = 1;
  if (lastBill) {
    const lastNumber = parseInt(lastBill.billNumber.split("-").pop() || "0");
    nextNumber = lastNumber + 1;
  }

  return `B-${year}-${String(nextNumber).padStart(4, "0")}`;
}
