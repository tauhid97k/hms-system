-- CreateEnum
CREATE TYPE "VisitEventType" AS ENUM ('VISIT_REGISTERED', 'VISIT_ASSIGNED', 'QUEUE_JOINED', 'QUEUE_CALLED', 'QUEUE_SKIPPED', 'ENTERED_ROOM', 'EXITED_ROOM', 'CONSULTATION_COMPLETED', 'PRESCRIPTION_GIVEN', 'TESTS_ORDERED', 'REFERRAL_GIVEN', 'CONSULTATION_BILLED', 'TESTS_BILLED', 'PAYMENT_RECEIVED', 'PAYMENT_PARTIAL', 'PAYMENT_REFUNDED', 'TEST_SAMPLE_COLLECTED', 'TEST_IN_PROGRESS', 'TEST_COMPLETED', 'TEST_REVIEWED', 'TEST_APPROVED', 'REPORT_GENERATED', 'REPORT_DELIVERED', 'DOCUMENT_UPLOADED', 'DOCUMENT_SHARED', 'VISIT_COMPLETED', 'VISIT_CANCELLED', 'VISIT_RESCHEDULED', 'FOLLOWUP_SCHEDULED', 'FOLLOWUP_REMINDER_SENT');

-- CreateTable
CREATE TABLE "visit_events" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "eventType" "VisitEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_events_visitId_performedAt_idx" ON "visit_events"("visitId", "performedAt");

-- CreateIndex
CREATE INDEX "visit_events_eventType_idx" ON "visit_events"("eventType");

-- CreateIndex
CREATE INDEX "visit_events_performedAt_idx" ON "visit_events"("performedAt");

-- CreateIndex
CREATE INDEX "visit_events_visitId_eventType_idx" ON "visit_events"("visitId", "eventType");

-- AddForeignKey
ALTER TABLE "visit_events" ADD CONSTRAINT "visit_events_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_events" ADD CONSTRAINT "visit_events_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
