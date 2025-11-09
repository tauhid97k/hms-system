import prisma from "./prisma";
import { VisitEventType } from "@/prisma/generated/client";

/**
 * Visit Event Sourcing Utilities
 *
 * This module provides helper functions for logging and querying visit events.
 * Events are used to track the complete patient journey through the hospital.
 *
 * Event Flow Example:
 * 1. VISIT_REGISTERED → Patient registered at reception
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
 * 16. VISIT_COMPLETED → Visit closed
 */

interface LogEventParams {
  visitId: string;
  eventType: VisitEventType;
  performedBy?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a new visit event
 */
export async function logVisitEvent({
  visitId,
  eventType,
  performedBy,
  description,
  metadata,
}: LogEventParams) {
  return await prisma.visit_events.create({
    data: {
      visitId,
      eventType,
      performedBy,
      description,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    },
  });
}

/**
 * Get all events for a visit (chronological order)
 */
export async function getVisitTimeline(visitId: string) {
  return await prisma.visit_events.findMany({
    where: { visitId },
    orderBy: { performedAt: "asc" },
    include: {
      performedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get the latest event of a specific type for a visit
 */
export async function getLatestEvent(
  visitId: string,
  eventType: VisitEventType,
) {
  return await prisma.visit_events.findFirst({
    where: {
      visitId,
      eventType,
    },
    orderBy: { performedAt: "desc" },
  });
}

/**
 * Check if an event has occurred for a visit
 */
export async function hasEvent(visitId: string, eventType: VisitEventType) {
  const count = await prisma.visit_events.count({
    where: {
      visitId,
      eventType,
    },
  });
  return count > 0;
}

/**
 * Get duration between two events (in minutes)
 */
export async function getEventDuration(
  visitId: string,
  startEvent: VisitEventType,
  endEvent: VisitEventType,
): Promise<number | null> {
  const [start, end] = await Promise.all([
    getLatestEvent(visitId, startEvent),
    getLatestEvent(visitId, endEvent),
  ]);

  if (!start || !end) return null;

  const durationMs = end.performedAt.getTime() - start.performedAt.getTime();
  return Math.round(durationMs / 1000 / 60); // Convert to minutes
}

/**
 * Get formatted journey for display
 */
export async function getVisitJourney(visitId: string) {
  const events = await getVisitTimeline(visitId);

  return events.map((event) => {
    const metadata = event.metadata as Record<string, any> | null;

    return {
      id: event.id,
      type: event.eventType,
      description: event.description || getEventDescription(event.eventType),
      timestamp: event.performedAt,
      performedBy: event.performedByUser?.name || "System",
      metadata,
      icon: getEventIcon(event.eventType),
      color: getEventColor(event.eventType),
    };
  });
}

/**
 * Helper: Get default description for event type
 */
function getEventDescription(eventType: VisitEventType): string {
  const descriptions: Record<VisitEventType, string> = {
    VISIT_REGISTERED: "Patient registered for visit",
    VISIT_ASSIGNED: "Visit assigned to doctor",
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
    VISIT_COMPLETED: "Visit completed",
    VISIT_CANCELLED: "Visit cancelled",
    VISIT_RESCHEDULED: "Visit rescheduled",
    FOLLOWUP_SCHEDULED: "Follow-up scheduled",
    FOLLOWUP_REMINDER_SENT: "Follow-up reminder sent",
  };

  return descriptions[eventType] || eventType;
}

/**
 * Helper: Get icon for event type (Lucide React icon name)
 */
function getEventIcon(eventType: VisitEventType): string {
  const icons: Record<VisitEventType, string> = {
    VISIT_REGISTERED: "ClipboardList",
    VISIT_ASSIGNED: "UserCheck",
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
    VISIT_COMPLETED: "CheckCircle2",
    VISIT_CANCELLED: "XCircle",
    VISIT_RESCHEDULED: "Calendar",
    FOLLOWUP_SCHEDULED: "CalendarPlus",
    FOLLOWUP_REMINDER_SENT: "BellRing",
  };

  return icons[eventType] || "Circle";
}

/**
 * Helper: Get color for event type
 */
function getEventColor(eventType: VisitEventType): string {
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
      prisma.visit_events.create({
        data: {
          visitId: event.visitId,
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
