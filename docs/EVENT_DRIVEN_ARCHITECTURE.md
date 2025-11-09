# Event-Driven Architecture - HMS Documentation

## Overview

This Hospital Management System uses **Event Sourcing** pattern to track the complete patient journey. Every significant action is logged as an immutable event in the `visit_events` table.

## Why Event Sourcing?

✅ **Complete Audit Trail** - Every action is recorded with timestamp and performer
✅ **Timeline Reconstruction** - Rebuild complete patient journey at any time
✅ **Duration Calculations** - Measure time between events (e.g., consultation duration)
✅ **State Machine Support** - Validate workflow transitions
✅ **Compliance & Legal** - Required for medical record keeping
✅ **Analytics** - Track performance metrics (average wait time, etc.)

## Database Schema

### `visit_events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (ULID) | Unique event identifier |
| `visitId` | String | Foreign key to visits |
| `eventType` | VisitEventType (Enum) | Type of event |
| `description` | String (Optional) | Human-readable description |
| `metadata` | JSON (Optional) | Flexible data (billId, testId, fileUrl, etc.) |
| `performedBy` | String (Optional) | User who performed action |
| `performedAt` | DateTime | When event occurred |

### Event Types (34 total)

#### Visit Registration
- `VISIT_REGISTERED` - Patient registered at reception
- `VISIT_ASSIGNED` - Assigned to doctor

#### Queue Management
- `QUEUE_JOINED` - Added to waiting queue
- `QUEUE_CALLED` - Called from waiting area
- `QUEUE_SKIPPED` - Missed their turn

#### Consultation Flow
- `ENTERED_ROOM` - Patient entered consultation
- `EXITED_ROOM` - Patient left consultation
- `CONSULTATION_COMPLETED` - Consultation finished

#### Clinical Actions
- `PRESCRIPTION_GIVEN` - Doctor prescribed medications
- `TESTS_ORDERED` - Lab tests ordered
- `REFERRAL_GIVEN` - Referred to specialist

#### Billing Events
- `CONSULTATION_BILLED` - Consultation fee billed
- `TESTS_BILLED` - Lab tests billed
- `PAYMENT_RECEIVED` - Full payment completed
- `PAYMENT_PARTIAL` - Partial payment
- `PAYMENT_REFUNDED` - Refund processed

#### Lab/Test Workflow
- `TEST_SAMPLE_COLLECTED` - Sample collected
- `TEST_IN_PROGRESS` - Lab processing
- `TEST_COMPLETED` - Test finished
- `TEST_REVIEWED` - Results reviewed by doctor
- `TEST_APPROVED` - Results approved
- `REPORT_GENERATED` - Report created
- `REPORT_DELIVERED` - Report given to patient

#### Document Events
- `DOCUMENT_UPLOADED` - File uploaded
- `DOCUMENT_SHARED` - Document shared

#### Visit Completion
- `VISIT_COMPLETED` - Visit fully closed
- `VISIT_CANCELLED` - Visit cancelled
- `VISIT_RESCHEDULED` - Visit rescheduled

#### Follow-up
- `FOLLOWUP_SCHEDULED` - Follow-up appointment booked
- `FOLLOWUP_REMINDER_SENT` - Reminder notification sent

## Usage Examples

### 1. Logging Events

```typescript
import { logVisitEvent } from "@/lib/visit-events";

// When patient enters room
await logVisitEvent({
  visitId: "visit_123",
  eventType: "ENTERED_ROOM",
  performedBy: userId,
  description: "Patient entered Room 5",
});

// When tests are ordered
await logVisitEvent({
  visitId: "visit_123",
  eventType: "TESTS_ORDERED",
  performedBy: doctorId,
  description: "Ordered CBC and Lipid Profile",
  metadata: {
    testOrderIds: ["test_1", "test_2"],
    testCount: 2,
  },
});

// When payment received
await logVisitEvent({
  visitId: "visit_123",
  eventType: "PAYMENT_RECEIVED",
  performedBy: receptionistId,
  metadata: {
    billId: "bill_456",
    amount: 150,
    paymentMethod: "CASH",
  },
});
```

### 2. Getting Visit Timeline

```typescript
import { getVisitTimeline } from "@/lib/visit-events";

const timeline = await getVisitTimeline("visit_123");
// Returns array of events with user info, ordered chronologically
```

### 3. Getting Formatted Journey (for UI)

```typescript
import { getVisitJourney } from "@/lib/visit-events";

const journey = await getVisitJourney("visit_123");
// Returns formatted events with icons, colors, descriptions
```

### 4. Calculating Durations

```typescript
import { getEventDuration } from "@/lib/visit-events";

// How long was consultation?
const consultDuration = await getEventDuration(
  "visit_123",
  "ENTERED_ROOM",
  "EXITED_ROOM"
);
console.log(`Consultation lasted ${consultDuration} minutes`);
```

### 5. Checking Event Existence

```typescript
import { hasEvent } from "@/lib/visit-events";

const isPaid = await hasEvent("visit_123", "PAYMENT_RECEIVED");
if (!isPaid) {
  // Show payment pending notice
}
```

### 6. Batch Logging (Transaction)

```typescript
import { logMultipleEvents } from "@/lib/visit-events";

// When creating a visit, log multiple events atomically
await logMultipleEvents([
  {
    visitId: "visit_123",
    eventType: "VISIT_REGISTERED",
    performedBy: receptionistId,
  },
  {
    visitId: "visit_123",
    eventType: "QUEUE_JOINED",
    performedBy: receptionistId,
  },
  {
    visitId: "visit_123",
    eventType: "CONSULTATION_BILLED",
    performedBy: receptionistId,
    metadata: { billId: "bill_456", amount: 150 },
  },
]);
```

## Typical Patient Journey Flow

### Standard OPD Visit

1. **Registration Phase**
   ```
   VISIT_REGISTERED → QUEUE_JOINED → CONSULTATION_BILLED → PAYMENT_RECEIVED
   ```

2. **Consultation Phase**
   ```
   QUEUE_CALLED → ENTERED_ROOM → (consultation happens) → EXITED_ROOM
   ```

3. **Clinical Actions**
   ```
   PRESCRIPTION_GIVEN
   TESTS_ORDERED → TESTS_BILLED → PAYMENT_RECEIVED
   ```

4. **Lab Phase** (if tests ordered)
   ```
   TEST_SAMPLE_COLLECTED → TEST_IN_PROGRESS → TEST_COMPLETED →
   TEST_REVIEWED → TEST_APPROVED → REPORT_GENERATED → REPORT_DELIVERED
   ```

5. **Closure**
   ```
   VISIT_COMPLETED
   ```

### Visit with Referral

```
VISIT_REGISTERED → ... → REFERRAL_GIVEN → VISIT_COMPLETED → FOLLOWUP_SCHEDULED
```

## Metadata Examples

### When billing:
```json
{
  "billId": "bill_123",
  "amount": 1500,
  "billItems": ["consultation", "ecg"],
  "discount": 100
}
```

### When ordering tests:
```json
{
  "testOrderIds": ["test_456", "test_789"],
  "tests": ["CBC", "Lipid Profile"],
  "testCount": 2,
  "priority": "normal"
}
```

### When delivering report:
```json
{
  "testId": "test_456",
  "reportUrl": "/documents/report_123.pdf",
  "fileSize": 524288,
  "deliveredTo": "patient",
  "signature": "John Doe"
}
```

### Consultation duration:
```json
{
  "durationMinutes": 15,
  "roomNumber": "5",
  "notes": "Regular checkup"
}
```

## Integration Points

### 1. Visit Creation (router/visits.ts)
```typescript
// When creating visit
await logVisitEvent({
  visitId: visit.id,
  eventType: "VISIT_REGISTERED",
  performedBy: userId,
});
```

### 2. Billing (router/billing.ts)
```typescript
// After successful payment
await logVisitEvent({
  visitId: bill.visitId,
  eventType: "PAYMENT_RECEIVED",
  metadata: { billId: bill.id, amount: bill.totalAmount },
});
```

### 3. Queue Management (router/queue.ts)
```typescript
// When calling patient
await logVisitEvent({
  visitId,
  eventType: "QUEUE_CALLED",
  performedBy: receptionistId,
});
```

### 4. Lab Tests (router/tests.ts)
```typescript
// When technician starts test
await logVisitEvent({
  visitId: testOrder.visitId,
  eventType: "TEST_IN_PROGRESS",
  performedBy: technicianId,
  metadata: { testOrderId: testOrder.id },
});
```

## Best Practices

### 1. Always Log Critical Events
- Visit creation/completion
- Payment transactions
- Test results
- Prescription given
- Entry/exit times

### 2. Include Metadata
- Link related entities (billId, testId, etc.)
- Store calculated values (duration, amount)
- Reference files (reportUrl, fileSize)

### 3. Use Transactions
- When multiple events must succeed together
- Example: Visit registration + queue joining + billing

### 4. Don't Modify Events
- Events are **immutable** - never update/delete
- If mistake, log compensating event (e.g., PAYMENT_REFUNDED)

### 5. Performance
- Use indexed fields for queries
- Filter by eventType for specific lookups
- Use visitId + performedAt for timeline

## Analytics Queries

### Average consultation time:
```sql
SELECT AVG(duration) FROM (
  SELECT
    EXTRACT(EPOCH FROM (
      (SELECT performedAt FROM visit_events
       WHERE visitId = v.id AND eventType = 'EXITED_ROOM')
      -
      (SELECT performedAt FROM visit_events
       WHERE visitId = v.id AND eventType = 'ENTERED_ROOM')
    )) / 60 as duration
  FROM visits v
) subquery;
```

### Most common event types:
```sql
SELECT eventType, COUNT(*) as count
FROM visit_events
GROUP BY eventType
ORDER BY count DESC;
```

### Daily visit statistics:
```sql
SELECT
  DATE(performedAt) as date,
  COUNT(DISTINCT visitId) as total_visits
FROM visit_events
WHERE eventType = 'VISIT_REGISTERED'
GROUP BY DATE(performedAt);
```

## Migration & Seeding

When seeding data, create realistic event sequences:

```typescript
// Create visit first
const visit = await prisma.visits.create({ ... });

// Then log events
await logMultipleEvents([
  { visitId: visit.id, eventType: "VISIT_REGISTERED", performedBy: receptionistId },
  { visitId: visit.id, eventType: "CONSULTATION_BILLED", metadata: { ... } },
  { visitId: visit.id, eventType: "PAYMENT_RECEIVED", metadata: { ... } },
  // ... more events
]);
```

## Future Enhancements

1. **Real-time Updates** - WebSocket notifications on new events
2. **Event Replay** - Rebuild visit state from events
3. **Snapshots** - Periodic state snapshots for performance
4. **Event Versioning** - Schema evolution support
5. **CQRS** - Separate read/write models
6. **Event Bus** - Pub/sub for cross-module events

---

**Remember**: Events tell the story of what happened. The visit record is just the current state. Always trust the events.
