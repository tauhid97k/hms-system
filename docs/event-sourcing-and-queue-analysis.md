# Event Sourcing & Queue System Analysis

## Executive Summary

**Event Sourcing Status**: ❌ Not true event sourcing - it's **audit logging**
**Queue System Status**: ⚠️ **NOT production-ready** - has critical race conditions and cannot scale horizontally

---

## 1. Event Sourcing Analysis

### What You Have: Audit Logging (Not Event Sourcing)

Your `appointment_events` table is an **audit log**, not event sourcing.

#### Key Differences

| Aspect | True Event Sourcing | Your Implementation (Audit Log) |
|--------|-------------------|--------------------------------|
| **Source of Truth** | Events are the source of truth | `appointments` table is source of truth |
| **State Reconstruction** | Rebuild state by replaying events | State stored directly in DB |
| **State Mutation** | Append-only events, no updates | Direct UPDATE on appointments table |
| **Querying** | Rebuild from events or use projections | Direct SELECT from appointments |
| **Time Travel** | Can replay to any point in time | Cannot reliably reconstruct past states |

#### Example: Your Current Flow

```typescript
// router/appointments.ts:316-323
const appointment = await prisma.appointments.update({
  where: { id: input.id },
  data: {
    status: input.status as AppointmentStatus,  // ❌ Directly mutating state
    ...(input.status === "IN_CONSULTATION" && { entryTime: new Date() }),
    ...(input.status === "COMPLETED" && { exitTime: new Date() }),
  },
});

// Then log the event AFTER mutation
await prisma.appointment_events.create({  // ✅ Logging what happened
  data: {
    appointmentId: input.id,
    eventType: eventType,
    performedBy: input.performedBy,
    description: `Status changed to ${input.status}`,
  },
});
```

**This is NOT event sourcing because:**
1. You're updating the `appointments` table directly
2. Events are logged AFTER the fact (audit trail)
3. If events are deleted/corrupted, you still have the current state
4. You cannot rebuild state from events alone

#### True Event Sourcing Would Look Like

```typescript
// ❌ DON'T update appointments directly
// ✅ Only append events
await prisma.appointment_events.create({
  data: {
    appointmentId: input.id,
    eventType: "STATUS_CHANGED_TO_IN_CONSULTATION",
    metadata: {
      previousStatus: "WAITING",
      newStatus: "IN_CONSULTATION",
      entryTime: new Date()
    }
  }
});

// Then rebuild state from events (projection)
const currentState = await rebuildAppointmentState(appointmentId);
// currentState.status = "IN_CONSULTATION" (computed from events)
```

### Your Audit Log: What It's Good For

✅ **Excellent for:**
- Compliance (HIPAA audit trails)
- Timeline reconstruction (`getAppointmentTimeline`)
- Duration calculation between events
- "Who did what when" queries
- Debugging and troubleshooting

❌ **Cannot do:**
- Rebuild state if `appointments` table is corrupted
- Time travel to exact past states (appointments table is mutated)
- Event replay for system recovery
- CQRS (Command Query Responsibility Segregation) patterns

### Is This a Problem?

**No!** For an HMS, audit logging is often more appropriate than true event sourcing:
- Simpler to implement and understand
- Faster queries (no event replay needed)
- Less storage overhead
- Easier to reason about for medical staff

**Keep what you have** - it's the right pattern for this use case.

---

## 2. Queue System Analysis

### Critical Issues: NOT Production-Ready ⚠️

Your queue system has **multiple critical race conditions** that will cause serious issues in production.

### Issue 1: Race Condition in Serial Number Generation

**Location**: `lib/queue-emitter.ts:81-94`

```typescript
export async function getNextSerialNumber(doctorId: string): Promise<number> {
  const todayStart = startOfDay(new Date());

  const lastVisit = await prisma.appointments.findFirst({
    where: {
      doctorId,
      appointmentDate: { gte: todayStart },
    },
    orderBy: { serialNumber: "desc" },  // ⚠️ Get last serial
    select: { serialNumber: true },
  });

  return (lastVisit?.serialNumber || 0) + 1;  // ❌ Race condition!
}
```

**The Problem:**

```
Time | Request A                    | Request B                    | Result
-----|------------------------------|------------------------------|--------
T1   | Query: last serial = 5       |                              |
T2   |                              | Query: last serial = 5       |
T3   | Calculate: 5 + 1 = 6         |                              |
T4   |                              | Calculate: 5 + 1 = 6         |
T5   | Insert serial = 6 ✅         |                              |
T6   |                              | Insert serial = 6 ❌ DUPLICATE! |
```

**Result**: Two patients get serial number 6 for the same doctor on the same day.

### Issue 2: Race Condition in Queue Position

**Location**: `lib/queue-emitter.ts:97-111`

```typescript
export async function getNextQueuePosition(doctorId: string): Promise<number> {
  const todayStart = startOfDay(new Date());

  const count = await prisma.appointments.count({
    where: {
      doctorId,
      appointmentDate: { gte: todayStart },
      status: { in: ["WAITING", "IN_CONSULTATION"] },
    },
  });

  return count + 1;  // ❌ Race condition!
}
```

**Same issue**: Multiple concurrent requests can get the same queue position.

### Issue 3: EventEmitter Does NOT Work in Production

**Location**: `lib/queue-emitter.ts:1-6`

```typescript
import { EventEmitter } from "events";

// Global event emitter for queue updates
export const queueEmitter = new EventEmitter();  // ❌ In-memory only!
```

**Critical Problems:**

1. **No Client Communication**
   - EventEmitter is server-side Node.js only
   - Events never reach the browser
   - UI has placeholder: `// TODO: Add WebSocket subscription` (queue-display.tsx:48)

2. **Horizontal Scaling FAILS**
   ```
   ┌─────────────┐         ┌─────────────┐
   │  Server 1   │         │  Server 2   │
   │             │         │             │
   │ EventEmitter│◀─────┐  │ EventEmitter│◀─────┐
   │  (Memory)   │      │  │  (Memory)   │      │
   └─────────────┘      │  └─────────────┘      │
         │              │        │               │
         │              │        │               │
   Client A         Emit Event   Client B    No Event!
   (sees update)        │        (NO UPDATE!)    │
                        │                         │
                   Creates appointment      Opens queue page
   ```

   - Each server instance has its own EventEmitter
   - Events don't cross server boundaries
   - Load balancer randomly assigns requests
   - **Result**: Clients see stale data, queue positions become chaotic

3. **No Persistence**
   - EventEmitter is in-memory
   - Server restart = all events lost
   - No message queue (Redis Pub/Sub, RabbitMQ, etc.)

### Issue 4: Queue Position Never Re-Adjusts

**Missing Logic:**

When a patient cancels or leaves the queue, positions are NOT adjusted:

```typescript
// Current: Patient cancels
await prisma.appointments.update({
  where: { id: appointmentId },
  data: { status: "CANCELLED" }  // Queue position stays the same!
});

// Result: Gaps in queue
// Queue positions: 1, 2, 4, 5, 7, 8 (missing 3 and 6)
```

No code exists to:
- Decrement positions for patients behind a cancelled appointment
- Re-sort queue when patient skips turn
- Handle queue position conflicts

### Issue 5: Bill Number Generation Has Same Race Condition

**Location**: `lib/queue-emitter.ts:114-134`

```typescript
export async function generateBillNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();

  const lastBill = await prisma.bills.findFirst({
    where: { billNumber: { startsWith: `B-${year}` } },
    orderBy: { createdAt: "desc" },  // ⚠️ Get last bill
    select: { billNumber: true },
  });

  let nextNumber = 1;
  if (lastBill) {
    const lastNumber = parseInt(lastBill.billNumber.split("-").pop() || "0");
    nextNumber = lastNumber + 1;  // ❌ Race condition!
  }

  return `B-${year}-${String(nextNumber).padStart(4, "0")}`;
}
```

**Same issue**: Multiple concurrent billing requests can generate duplicate bill numbers.

---

## 3. Real-World Failure Scenarios

### Scenario 1: Morning Rush Hour

```
8:00 AM - 50 patients arrive for appointments
- 10 concurrent requests for Dr. Smith
- All read "last serial = 0"
- All generate serial = 1
- Result: 10 patients with serial #1
- Queue display shows chaos
- Patients complain they're being skipped
```

### Scenario 2: Multi-Server Deployment

```
Hospital has 3 servers behind load balancer:
- Receptionist A creates appointment → Server 1
- Server 1 emits queue update → EventEmitter (Server 1)
- Receptionist B opens queue page → Server 2
- Server 2 has no event → Shows stale data
- Doctor calls next patient based on stale queue
- Wrong patient enters consultation room
```

### Scenario 3: Database Transaction Isolation

```typescript
// Even within transaction, race condition exists:
const result = await prisma.$transaction(async (tx) => {
  const serialNumber = await getNextSerialNumber(input.doctorId);  // ❌ Not atomic
  const appointment = await tx.appointments.create({
    data: { serialNumber, ... }
  });
  return appointment;
});
```

Problem: `getNextSerialNumber` runs OUTSIDE the transaction's isolation.

---

## 4. Scalability Assessment

### Can This Queue System Scale?

| Scenario | Current System | Result |
|----------|----------------|--------|
| **Single Server** | Might work | ⚠️ Race conditions still possible |
| **Low Traffic** (<10 appointments/hour) | Probably OK | ⚠️ Occasional duplicates |
| **Medium Traffic** (50-100/hour) | FAILS | ❌ Frequent duplicates |
| **High Traffic** (>200/hour) | FAILS BADLY | ❌ Chaos |
| **Multiple Servers** | FAILS | ❌ Cannot work at all |
| **Real-time Updates** | DOES NOT WORK | ❌ No WebSocket/SSE |

### Answer: **NO - This queue system CANNOT scale**

---

## 5. Solutions & Recommendations

### Fix 1: Use Database Sequences for Serial Numbers

**Option A: PostgreSQL Sequence**

```sql
-- Migration
CREATE SEQUENCE doctor_serial_seq_{{ doctorId }};

-- Usage
SELECT nextval('doctor_serial_seq_' || :doctorId);
```

**Option B: Atomic Counter in Redis**

```typescript
import Redis from 'ioredis';
const redis = new Redis();

export async function getNextSerialNumber(doctorId: string): Promise<number> {
  const key = `doctor:${doctorId}:serial:${format(new Date(), 'yyyy-MM-dd')}`;
  return await redis.incr(key);  // Atomic operation
}
```

**Option C: Database Lock**

```typescript
export async function getNextSerialNumber(doctorId: string): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    // Lock the last appointment row
    const lastVisit = await tx.$queryRaw<Array<{ serialNumber: number }>>`
      SELECT "serialNumber"
      FROM appointments
      WHERE "doctorId" = ${doctorId}
        AND "appointmentDate" >= ${startOfDay(new Date())}
      ORDER BY "serialNumber" DESC
      FOR UPDATE
      LIMIT 1
    `;

    return (lastVisit[0]?.serialNumber || 0) + 1;
  });
}
```

### Fix 2: Implement Real-time Updates

**Option A: Server-Sent Events (SSE) - Simpler**

```typescript
// app/api/queue/[doctorId]/stream/route.ts
export async function GET(
  request: Request,
  { params }: { params: { doctorId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (event: QueueUpdateEvent) => {
        if (event.doctorId === params.doctorId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event.queue)}\n\n`)
          );
        }
      };

      queueEmitter.on('queue-update', listener);

      request.signal.addEventListener('abort', () => {
        queueEmitter.off('queue-update', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Option B: WebSocket - More Complex but Better**

```typescript
// Use Socket.io or ws library
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('subscribe-queue', (doctorId) => {
    socket.join(`queue:${doctorId}`);
  });
});

// Emit updates
queueEmitter.on('queue-update', (event) => {
  io.to(`queue:${event.doctorId}`).emit('queue-update', event.queue);
});
```

**Option C: Redis Pub/Sub (For Multi-Server)**

```typescript
import Redis from 'ioredis';
const redis = new Redis();
const redisSub = new Redis();

// Publisher (any server)
export async function emitQueueUpdate(doctorId: string) {
  const queue = await getQueueForDoctor(doctorId);
  await redis.publish(`queue:${doctorId}`, JSON.stringify(queue));
}

// Subscriber (all servers)
redisSub.subscribe('queue:*');
redisSub.on('message', (channel, message) => {
  const doctorId = channel.split(':')[1];
  const queue = JSON.parse(message);

  // Send to connected WebSocket clients
  io.to(`queue:${doctorId}`).emit('queue-update', queue);
});
```

### Fix 3: Add Unique Constraints

```prisma
// prisma/schema.prisma
model appointments {
  // ...existing fields

  @@unique([doctorId, appointmentDate, serialNumber])  // Prevent duplicates
  @@unique([doctorId, appointmentDate, queuePosition]) // Prevent duplicates
}
```

### Fix 4: Implement Queue Position Re-adjustment

```typescript
export async function removeFromQueue(appointmentId: string) {
  return await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointments.findUnique({
      where: { id: appointmentId },
      select: { doctorId: true, appointmentDate: true, queuePosition: true }
    });

    if (!appointment) throw new Error('Appointment not found');

    // Update status
    await tx.appointments.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    // Decrement positions for all patients behind this one
    await tx.appointments.updateMany({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        queuePosition: { gt: appointment.queuePosition },
        status: { in: ['WAITING', 'IN_CONSULTATION'] }
      },
      data: {
        queuePosition: { decrement: 1 }
      }
    });
  });
}
```

---

## 6. Recommended Architecture for Production

### For Single Server (Simpler)

```
┌──────────────────────────────────────┐
│         Next.js Server               │
│                                      │
│  ┌────────────┐    ┌─────────────┐  │
│  │  API Route │───▶│   Postgres  │  │
│  │  (ORPC)    │    │  (WITH LOCKS)│  │
│  └────────────┘    └─────────────┘  │
│        │                             │
│        ▼                             │
│  ┌────────────┐                      │
│  │    SSE     │───────────┐          │
│  │  Endpoint  │           │          │
│  └────────────┘           │          │
│                           │          │
└───────────────────────────┼──────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Browser      │
                    │  EventSource  │
                    └───────────────┘
```

### For Multi-Server (Production)

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └───────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐    ┌───────▼──────┐    ┌──────▼───────┐
│  Server 1    │    │  Server 2    │    │  Server 3    │
│              │    │              │    │              │
│  WebSocket   │    │  WebSocket   │    │  WebSocket   │
│  Handler     │    │  Handler     │    │  Handler     │
└───────┬──────┘    └───────┬──────┘    └──────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Redis Pub/Sub│
                    │  (Message Bus)│
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │   PostgreSQL  │
                    │  (Source of   │
                    │   Truth)      │
                    └───────────────┘
```

---

## 7. Migration Path

### Phase 1: Fix Race Conditions (Critical - Do First)

1. Add unique constraints to prevent duplicates
2. Implement database locks or Redis atomic counters
3. Test with concurrent load (use tools like Apache Bench or k6)

### Phase 2: Add Real-time Updates (Important)

1. Choose SSE (simpler) or WebSocket (better UX)
2. Implement for single server first
3. Test with multiple clients

### Phase 3: Scale Horizontally (When Needed)

1. Add Redis for distributed state
2. Implement Redis Pub/Sub for cross-server communication
3. Load test with multiple server instances

---

## 8. Testing Recommendations

### Load Test Serial Number Generation

```bash
# Install k6: https://k6.io
k6 run load-test-queue.js
```

```javascript
// load-test-queue.js
import http from 'k6/http';

export const options = {
  vus: 50,  // 50 concurrent users
  duration: '30s',
};

export default function () {
  http.post('http://localhost:3000/rpc', JSON.stringify({
    method: 'appointments.create',
    params: {
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      // ... other params
    }
  }));
}
```

Check for duplicate serial numbers in database after test.

---

## 9. Summary

### Event Sourcing
✅ **Keep your current audit logging** - it's appropriate for HMS
- Good for compliance and debugging
- Not true event sourcing, but that's OK
- Consider renaming to "Audit Logs" for clarity

### Queue System
❌ **MUST FIX before production**

**Critical Issues:**
1. ❌ Race conditions in serial/queue number generation
2. ❌ EventEmitter doesn't reach clients (no real-time updates)
3. ❌ Cannot scale to multiple servers
4. ❌ Queue positions never re-adjust
5. ❌ Bill numbers have same race condition

**Priority Fixes:**
1. **IMMEDIATE**: Add unique constraints + database locks
2. **HIGH**: Implement SSE or WebSocket for real-time updates
3. **MEDIUM**: Redis Pub/Sub for multi-server (when scaling)
4. **MEDIUM**: Queue position re-adjustment logic

**Effort Estimate:**
- Phase 1 (race conditions): 2-3 days
- Phase 2 (real-time): 3-5 days
- Phase 3 (multi-server): 5-7 days

---

## Questions?

Ask about:
- Specific implementation details
- Code examples for any fix
- Testing strategies
- Deployment considerations
