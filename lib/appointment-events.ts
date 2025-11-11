import prisma from "./prisma";
import { AppointmentEventType } from "../prisma/generated/client";

/**
 * Appointment Event Sourcing Utilities
 *
 * This module provides helper functions for logging and querying appointment events.
 * Events are used to track the complete patient journey through the hospital.
 *
 * Event Flow Example:
 * 1. APPOINTMENT_REGISTERED → Patient registered at reception
 * 2. QUEUE_JOINED → Patient added to doctor's queue
 * 3. CONSULTATION_BILLED → Consultation fee billed
 * 4. PAYMENT_RECEIVED → Payment completed
 * 5. QUEUE_CALLED → Patient called from waiting area
 * 6. ENTERED_ROOM → Patient entered consultation room
 * 7. EXITED_ROOM → Consultation ended
 * 8. PRESCRIPTION_GIVEN → Doctor prescribed medications
 * 9. TESTS_ORDERED → Lab tests ordered
 * 10. TESTS_BILLED → Lab tests billed
 * 11. TEST_SAMPLE_COLLECTED → Sample collected
 * 12. TEST_IN_PROGRESS → Lab processing
 * 13. TEST_COMPLETED → Lab finished
 * 14. REPORT_GENERATED → Report ready
 * 15. REPORT_DELIVERED → Report given to patient
 * 16. APPOINTMENT_COMPLETED → Appointment closed
 */

interface LogEventParams {
  appointmentId: string;
  eventType: AppointmentEventType;
  performedBy?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a new appointment event
 */
export async function logAppointmentEvent({
  appointmentId,
  eventType,
  performedBy,
  description,
  metadata,
}: LogEventParams) {
  return await prisma.appointment_events.create({
    data: {
      appointmentId,
      eventType,
      performedBy,
      description,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    },
  });
}

/**
 * Get all events for an appointment (chronological order)
 */
export async function getAppointmentTimeline(appointmentId: string) {
  return await prisma.appointment_events.findMany({
    where: { appointmentId },
    orderBy: { performedAt: "asc" },
    include: {
      performedByEmployee: {
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
  });
}

/**
 * Get the latest event of a specific type for an appointment
 */
export async function getLatestEvent(
  appointmentId: string,
  eventType: AppointmentEventType,
) {
  return await prisma.appointment_events.findFirst({
    where: {
      appointmentId,
      eventType,
    },
    orderBy: { performedAt: "desc" },
  });
}

/**
 * Check if an event has occurred for an appointment
 */
export async function hasEvent(appointmentId: string, eventType: AppointmentEventType) {
  const count = await prisma.appointment_events.count({
    where: {
      appointmentId,
      eventType,
    },
  });
  return count > 0;
}

/**
 * Get duration between two events (in minutes)
 */
export async function getEventDuration(
  appointmentId: string,
  startEvent: AppointmentEventType,
  endEvent: AppointmentEventType,
): Promise<number | null> {
  const [start, end] = await Promise.all([
    getLatestEvent(appointmentId, startEvent),
    getLatestEvent(appointmentId, endEvent),
  ]);

  if (!start || !end) return null;

  const durationMs = end.performedAt.getTime() - start.performedAt.getTime();
  return Math.round(durationMs / 1000 / 60); // Convert to minutes
}

/**
 * Get formatted journey for display
 */
export async function getAppointmentJourney(appointmentId: string) {
  const events = await getAppointmentTimeline(appointmentId);

  return events.map((event) => {
    const metadata = event.metadata as Record<string, any> | null;

    return {
      id: event.id,
      type: event.eventType,
      description: event.description || getEventDescription(event.eventType),
      timestamp: event.performedAt,
      performedBy: event.performedByEmployee?.user?.name || "System",
      metadata,
      icon: getEventIcon(event.eventType),
      color: getEventColor(event.eventType),
    };
  });
}

/**
 * Helper: Get default description for event type
 */
function getEventDescription(eventType: AppointmentEventType): string {
  const descriptions: Record<AppointmentEventType, string> = {
    APPOINTMENT_REGISTERED: "Patient registered for appointment",
    APPOINTMENT_ASSIGNED: "Appointment assigned to doctor",
    QUEUE_JOINED: "Patient joined the queue",
    QUEUE_CALLED: "Patient called from waiting area",
    QUEUE_SKIPPED: "Patient skipped their turn",
    ENTERED_ROOM: "Patient entered consultation room",
    EXITED_ROOM: "Patient exited consultation room",
    CONSULTATION_COMPLETED: "Consultation completed",
    PRESCRIPTION_GIVEN: "Prescription provided",
    TESTS_ORDERED: "Lab tests ordered",
    REFERRAL_GIVEN: "Referral given",
    CONSULTATION_BILLED: "Consultation fee billed",
    TESTS_BILLED: "Lab tests billed",
    PAYMENT_RECEIVED: "Payment received",
    PAYMENT_PARTIAL: "Partial payment received",
    PAYMENT_REFUNDED: "Payment refunded",
    TEST_SAMPLE_COLLECTED: "Sample collected for testing",
    TEST_IN_PROGRESS: "Test processing started",
    TEST_COMPLETED: "Test completed",
    TEST_REVIEWED: "Test results reviewed",
    TEST_APPROVED: "Test results approved",
    REPORT_GENERATED: "Report generated",
    REPORT_DELIVERED: "Report delivered to patient",
    DOCUMENT_UPLOADED: "Document uploaded",
    DOCUMENT_SHARED: "Document shared",
    APPOINTMENT_COMPLETED: "Appointment completed",
    APPOINTMENT_CANCELLED: "Appointment cancelled",
    APPOINTMENT_RESCHEDULED: "Appointment rescheduled",
    FOLLOWUP_SCHEDULED: "Follow-up scheduled",
    FOLLOWUP_REMINDER_SENT: "Follow-up reminder sent",
  };

  return descriptions[eventType] || eventType;
}

/**
 * Helper: Get icon for event type (Lucide React icon name)
 */
function getEventIcon(eventType: AppointmentEventType): string {
  const icons: Record<AppointmentEventType, string> = {
    APPOINTMENT_REGISTERED: "ClipboardList",
    APPOINTMENT_ASSIGNED: "UserCheck",
    QUEUE_JOINED: "Users",
    QUEUE_CALLED: "Bell",
    QUEUE_SKIPPED: "SkipForward",
    ENTERED_ROOM: "DoorOpen",
    EXITED_ROOM: "DoorClosed",
    CONSULTATION_COMPLETED: "CheckCircle",
    PRESCRIPTION_GIVEN: "Pill",
    TESTS_ORDERED: "TestTube",
    REFERRAL_GIVEN: "ArrowRightCircle",
    CONSULTATION_BILLED: "Receipt",
    TESTS_BILLED: "FileText",
    PAYMENT_RECEIVED: "CreditCard",
    PAYMENT_PARTIAL: "DollarSign",
    PAYMENT_REFUNDED: "RefreshCcw",
    TEST_SAMPLE_COLLECTED: "Syringe",
    TEST_IN_PROGRESS: "Loader",
    TEST_COMPLETED: "CheckSquare",
    TEST_REVIEWED: "Eye",
    TEST_APPROVED: "BadgeCheck",
    REPORT_GENERATED: "FileCheck",
    REPORT_DELIVERED: "Send",
    DOCUMENT_UPLOADED: "Upload",
    DOCUMENT_SHARED: "Share2",
    APPOINTMENT_COMPLETED: "CheckCircle2",
    APPOINTMENT_CANCELLED: "XCircle",
    APPOINTMENT_RESCHEDULED: "Calendar",
    FOLLOWUP_SCHEDULED: "CalendarPlus",
    FOLLOWUP_REMINDER_SENT: "BellRing",
  };

  return icons[eventType] || "Circle";
}

/**
 * Helper: Get color for event type
 */
function getEventColor(eventType: AppointmentEventType): string {
  if (eventType.startsWith("PAYMENT")) return "green";
  if (eventType.includes("CANCELLED") || eventType.includes("SKIPPED"))
    return "red";
  if (eventType.includes("COMPLETED") || eventType.includes("APPROVED"))
    return "blue";
  if (eventType.includes("BILLED")) return "orange";
  if (eventType.includes("TEST")) return "purple";
  if (eventType.includes("DOCUMENT") || eventType.includes("REPORT"))
    return "cyan";
  return "gray";
}

/**
 * Batch log multiple events (useful for complex operations)
 */
export async function logMultipleEvents(events: LogEventParams[]) {
  return await prisma.$transaction(
    events.map((event) =>
      prisma.appointment_events.create({
        data: {
          appointmentId: event.appointmentId,
          eventType: event.eventType,
          performedBy: event.performedBy,
          description: event.description,
          metadata: event.metadata
            ? JSON.parse(JSON.stringify(event.metadata))
            : null,
        },
      }),
    ),
  );
}
