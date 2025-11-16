# 🏥 Hospital Management System (HMS) - Complete Documentation

**Version:** 2.0  
**Last Updated:** November 17, 2025  
**Tech Stack:** Next.js 15, Prisma, PostgreSQL, oRPC, TypeScript, Redis

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Design](#database-design)
4. [Patient Journey Flow](#patient-journey-flow)
5. [Key Features](#key-features)
6. [Technical Implementation](#technical-implementation)
7. [Real-Time Queue System](#real-time-queue-system)
8. [Security & Compliance](#security--compliance)

---

## 🎯 System Overview

### Purpose

A comprehensive Hospital Management System designed to handle the complete patient journey from registration through consultation, prescriptions, lab tests, billing, and reporting.

### Capacity

- **Daily Patients:** 1000+
- **Concurrent Users:** 100+
- **Data Retention:** Years of historical data
- **Real-time Updates:** Queue management via SSE

### Core Modules

1. **Patient Management** - Registration, records, history
2. **Appointment System** - Scheduling, queue management
3. **Consultation** - Doctor-patient interaction, prescriptions
4. **Laboratory** - Test orders, results, reports
5. **Billing** - Flexible billing for any service
6. **Pharmacy** - Medicine inventory, prescriptions
7. **Reports & Analytics** - Comprehensive reporting

---

## 🏗️ Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│  Next.js 15 (App Router) + React + TypeScript          │
│  TailwindCSS + shadcn/ui + Radix UI                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      API Layer                           │
│  oRPC (Type-safe RPC) + Server Actions                  │
│  Server-Sent Events (SSE) for real-time updates         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Business Logic                         │
│  Routers (departments, patients, appointments, etc.)     │
│  Validation (Yup → migrating to Zod v4)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  Prisma ORM + PostgreSQL                                │
│  Redis (Queue state, caching, pub/sub)                  │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Server-Side Rendering (SSR)**
   - All data fetching on server
   - Props passed to client components
   - Better performance and SEO

2. **Type-Safe RPC (oRPC)**
   - End-to-end type safety
   - No REST boilerplate
   - Automatic validation

3. **Event Sourcing (Audit Logging)**
   - Immutable event log
   - Complete audit trail
   - Timeline reconstruction

4. **Polymorphic Relations**
   - Flexible billing system
   - Future-proof design
   - No schema changes for new types

---

## 💾 Database Design

### Overview

- **Total Models:** 27
- **Total Indexes:** 70+
- **Database:** PostgreSQL
- **ORM:** Prisma
- **ID Strategy:** ULID (time-sortable)

### Core Models

#### 1. Users & Authentication

```prisma
users
├── sessions (JWT tokens)
├── accounts (OAuth providers)
├── user_roles (many-to-many)
└── employees (extended profile)
```

#### 2. RBAC System

```prisma
roles
├── role_permissions (many-to-many)
└── user_roles (many-to-many)

permissions
└── role_permissions
```

**Benefits:**

- ✅ Unlimited custom roles
- ✅ Users can have multiple roles
- ✅ Granular permissions per module
- ✅ No schema changes for new roles

#### 3. Patient Management

```prisma
patients
├── appointments
├── bills
└── documents
```

**Fields:**

- `patientId` - Unique patient identifier (e.g., P-2024-0001)
- `name`, `age`, `gender`, `phone`, `email`
- `bloodGroup`, `address`, `notes`
- `isActive` - Soft delete support

#### 4. Appointments & Queue

```prisma
appointments
├── patient (relation)
├── doctor (employee relation)
├── assignedByEmployee (relation)
├── bills
├── prescriptions
├── testOrders
└── appointmentEvents (audit log)
```

**Key Fields:**

- `serialNumber` - Daily serial (1, 2, 3...)
- `queuePosition` - Current position in queue
- `status` - WAITING | IN_CONSULTATION | COMPLETED | CANCELLED
- `appointmentType` - NEW | FOLLOWUP
- `appointmentMonth` - YYYY-MM (for partitioning)

**Unique Constraints:**

```prisma
@@unique([doctorId, appointmentDate, serialNumber])
@@unique([doctorId, appointmentDate, queuePosition])
```

#### 5. Event Sourcing (Audit Log)

```prisma
appointment_events
├── appointmentId
├── eventType (34 event types)
├── description
├── metadata (JSON)
├── performedBy (employee)
└── performedAt (timestamp)
```

**Event Types:**

- Registration: `APPOINTMENT_REGISTERED`, `APPOINTMENT_ASSIGNED`
- Queue: `QUEUE_JOINED`, `QUEUE_CALLED`, `QUEUE_SKIPPED`
- Consultation: `ENTERED_ROOM`, `EXITED_ROOM`, `CONSULTATION_COMPLETED`
- Clinical: `PRESCRIPTION_GIVEN`, `TESTS_ORDERED`, `REFERRAL_GIVEN`
- Billing: `CONSULTATION_BILLED`, `PAYMENT_RECEIVED`, `PAYMENT_PARTIAL`
- Lab: `TEST_SAMPLE_COLLECTED`, `TEST_COMPLETED`, `REPORT_DELIVERED`

#### 6. Billing System (Polymorphic)

```prisma
bills
├── billableType (string) - "appointment" | "test" | "medicine" | "any"
├── billableId (string) - ID of billable entity
├── billItems (polymorphic items)
└── payments
```

**Benefits:**

- ✅ Bill anything without schema changes
- ✅ Same logic for all types
- ✅ Future-proof design

#### 7. Prescriptions

```prisma
prescriptions
├── appointment (relation)
├── doctor (relation)
├── items (prescription_items)
├── notes
└── followUpDate
```

```prisma
prescription_items
├── medicine (relation)
├── instruction (relation)
├── duration
└── notes
```

#### 8. Laboratory

```prisma
labs
└── test_types
    └── test_orders
        └── test_results
```

**Workflow:**

1. Doctor orders test → `test_orders` (status: ORDERED)
2. Sample collected → `test_results` (status: IN_PROGRESS)
3. Technician completes → (status: COMPLETED)
4. Doctor reviews → (status: REVIEWED)
5. Report released → (status: RELEASED)
6. Patient receives → (status: DELIVERED)

### Indexing Strategy

**Performance Indexes:**

```prisma
// High-frequency queries
@@index([doctorId, appointmentDate, queuePosition]) // Queue management
@@index([status, appointmentDate]) // Today's appointments
@@index([patientId, appointmentDate]) // Patient history
@@index([appointmentMonth]) // Monthly partitioning

// Search indexes
@@index([name]) // Patient search
@@index([phone]) // Phone lookup
@@index([email]) // Email lookup

// Status indexes
@@index([isActive]) // Active records
@@index([status]) // Status filtering
```

---

## 🔄 Patient Journey Flow

### Complete Workflow

```
1. REGISTRATION (Reception)
   ├─→ Patient arrives
   ├─→ Create/update patient record
   ├─→ Create appointment
   ├─→ Assign to doctor
   ├─→ Generate serial number
   └─→ Event: APPOINTMENT_REGISTERED

2. QUEUE MANAGEMENT
   ├─→ Patient joins queue (queuePosition assigned)
   ├─→ Event: QUEUE_JOINED
   ├─→ Real-time SSE updates to doctor's screen
   ├─→ Doctor calls next patient
   ├─→ Event: QUEUE_CALLED
   └─→ Status: WAITING → IN_CONSULTATION

3. CONSULTATION (Doctor)
   ├─→ Patient enters room
   ├─→ Event: ENTERED_ROOM
   ├─→ Doctor examines patient
   ├─→ Records diagnosis
   ├─→ Prescribes medicines
   ├─→ Event: PRESCRIPTION_GIVEN
   ├─→ Orders lab tests (if needed)
   ├─→ Event: TESTS_ORDERED
   ├─→ Patient exits
   ├─→ Event: EXITED_ROOM
   └─→ Status: IN_CONSULTATION → COMPLETED

4. BILLING (Cashier)
   ├─→ Create bill (consultation + tests)
   ├─→ Event: CONSULTATION_BILLED
   ├─→ Event: TESTS_BILLED
   ├─→ Patient pays
   ├─→ Event: PAYMENT_RECEIVED
   └─→ Generate receipt

5. LABORATORY (if tests ordered)
   ├─→ Collect sample
   ├─→ Event: TEST_SAMPLE_COLLECTED
   ├─→ Process test
   ├─→ Event: TEST_IN_PROGRESS
   ├─→ Complete test
   ├─→ Event: TEST_COMPLETED
   ├─→ Doctor reviews
   ├─→ Event: TEST_REVIEWED
   ├─→ Release report
   ├─→ Event: REPORT_GENERATED
   └─→ Deliver to patient
       └─→ Event: REPORT_DELIVERED

6. PHARMACY (if prescribed)
   ├─→ Pharmacist views prescription
   ├─→ Dispenses medicines
   └─→ Patient receives medicines

7. FOLLOW-UP (if scheduled)
   ├─→ Event: FOLLOWUP_SCHEDULED
   ├─→ Reminder sent
   └─→ Event: FOLLOWUP_REMINDER_SENT
```

### Timeline Reconstruction

Any appointment's complete journey can be reconstructed:

```typescript
const events = await prisma.appointment_events.findMany({
  where: { appointmentId },
  orderBy: { performedAt: 'asc' },
  include: { performedByEmployee: { include: { user: true } } }
});

// Result: Complete timeline with timestamps and performers
```

---

## ✨ Key Features

### 1. Real-Time Queue Management

**Technology:** Server-Sent Events (SSE) + Redis Pub/Sub

**Flow:**

```
Doctor's Screen
    ↓
SSE Connection (/api/queue/stream/:doctorId)
    ↓
Redis Subscriber (queue:doctor:${doctorId})
    ↓
Real-time Updates (new patient, position changes, status updates)
```

**Features:**

- ✅ Live queue updates
- ✅ Auto-reconnection with exponential backoff
- ✅ Queue position tracking
- ✅ Serial number management
- ✅ Status changes broadcast

### 2. Flexible Billing

**Polymorphic Design:**

```typescript
// Bill anything
{
  billableType: "appointment",
  billableId: "appointment-123",
  items: [
    { itemableType: "consultation", itemableId: "doctor-1", amount: 500 },
    { itemableType: "test", itemableId: "test-order-1", amount: 1200 },
    { itemableType: "medicine", itemableId: "med-1", amount: 350 }
  ]
}
```

### 3. Complete Audit Trail

Every action logged:

```typescript
await logEvent({
  appointmentId,
  eventType: "PRESCRIPTION_GIVEN",
  description: "Doctor prescribed 3 medicines",
  metadata: { prescriptionId, medicineCount: 3 },
  performedBy: doctorId
});
```

### 4. Patient History

Complete medical history accessible:

- All appointments
- All prescriptions
- All lab tests
- All bills
- All documents
- Complete timeline

### 5. Role-Based Access Control

```typescript
// Dynamic permissions
const canViewPatients = await checkPermission(userId, "patients:view");
const canCreateBills = await checkPermission(userId, "billing:create");
const canApproveTests = await checkPermission(userId, "labs:approve");
```

---

## 🔧 Technical Implementation

### Router Pattern

All routers follow consistent pattern:

```typescript
// router/patients.ts
import { os } from '@orpc/server';
import { paginationSchema } from '@/schema/paginationSchema';
import { z } from 'zod';

export const getPatients = os
  .route({
    method: 'GET',
    path: '/patients',
    summary: 'Get all patients'
  })
  .input(
    paginationSchema.extend({
      search: z.string().optional(),
      isActive: z.enum(['true', 'false', 'all']).optional()
    })
  )
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    const [patients, total] = await prisma.$transaction([
      prisma.patients.findMany({ where, skip, take }),
      prisma.patients.count({ where })
    ]);

    return {
      data: patients,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  });
```

### Page Pattern (Server Component)

```typescript
// app/dashboard/patients/page.tsx
export default async function PatientsPage({ searchParams }) {
  // Server-side data fetching
  const patients = await client.patients.getAll({
    page: Number(searchParams.page) || 1,
    limit: 20,
    search: searchParams.search
  });

  // Pass as props to client component
  return <PatientsTable initialData={patients} />;
}
```

### Client Component Pattern

```typescript
// _components/patients-table.tsx
"use client";

import { createSafeClient } from '@orpc/client';

const safeClient = createSafeClient(client);

export function PatientsTable({ initialData }) {
  const handleDelete = async (id: string) => {
    const { data, error } = await safeClient.patients.delete(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Patient deleted");
    router.refresh(); // Revalidate server data
  };

  return <DataTable data={initialData.data} />;
}
```

### Modal/Dialog Pattern

```typescript
// Always render, control with 'open' prop
export function ParentComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  return (
    <>
      <Button onClick={() => {
        setSelectedItem(item);
        setDialogOpen(true);
      }}>
        Open
      </Button>

      {/* Always rendered, not conditionally */}
      <SomeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
      />
    </>
  );
}
```

---

## 🔴 Real-Time Queue System

### Architecture

```
┌─────────────────┐
│  Doctor Screen  │
│  (Client)       │
└────────┬────────┘
         │ SSE Connection
         ↓
┌─────────────────┐
│  SSE Endpoint   │
│  /api/queue/    │
│  stream/:id     │
└────────┬────────┘
         │ Subscribe
         ↓
┌─────────────────┐
│  Redis Pub/Sub  │
│  queue:doctor:  │
│  ${doctorId}    │
└────────┬────────┘
         │ Publish
         ↓
┌─────────────────┐
│  Queue Updates  │
│  (Appointments) │
└─────────────────┘
```

### Implementation

**1. Redis Queue State:**

```typescript
// Store queue as sorted set (by queuePosition)
await redis.zadd(
  `queue:doctor:${doctorId}:${date}`,
  queuePosition,
  appointmentId
);

// Get queue
const queue = await redis.zrange(
  `queue:doctor:${doctorId}:${date}`,
  0,
  -1,
  'WITHSCORES'
);
```

**2. SSE Endpoint:**

```typescript
// app/api/queue/stream/[doctorId]/route.ts
export async function GET(request, { params }) {
  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = redis.duplicate();
      await subscriber.subscribe(`queue:${params.doctorId}`);

      subscriber.on('message', (channel, message) => {
        controller.enqueue(`data: ${message}\n\n`);
      });
    }
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

**3. Client Hook:**

```typescript
// lib/hooks/use-queue-stream.ts
export function useQueueStream({ doctorId }) {
  const [queue, setQueue] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/queue/stream/${doctorId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setQueue(data);
    };

    eventSource.onerror = () => {
      // Exponential backoff reconnection
    };

    return () => eventSource.close();
  }, [doctorId]);

  return { queue, isConnected };
}
```

---

## 🔒 Security & Compliance

### Authentication

- JWT-based sessions
- OAuth support (Google, etc.)
- Secure password hashing (bcrypt)
- Session expiration

### Authorization

- Role-based access control (RBAC)
- Granular permissions
- Route protection
- API endpoint guards

### Data Protection

- Encrypted sensitive data
- HIPAA compliance ready
- Audit logging (all actions tracked)
- Soft delete (data retention)

### Compliance Features

- Complete audit trail
- Immutable event log
- User action tracking
- Data access logging
- Retention policies

---

## 📊 Performance Optimizations

### Database

- ✅ Strategic indexing (70+ indexes)
- ✅ Compound indexes for complex queries
- ✅ Monthly partitioning (`appointmentMonth`)
- ✅ Connection pooling
- ✅ Query optimization

### Caching

- ✅ Redis for queue state
- ✅ Next.js built-in caching
- ✅ Static data caching
- ✅ Revalidation strategies

### Real-Time

- ✅ SSE for live updates
- ✅ Redis Pub/Sub
- ✅ Efficient queue management
- ✅ Auto-reconnection

### Frontend

- ✅ Server-side rendering
- ✅ Optimistic updates
- ✅ Code splitting
- ✅ Image optimization

---

## 🚀 Scalability

### Horizontal Scaling

- Stateless API servers
- Redis for shared state
- Load balancing ready
- Session management

### Vertical Scaling

- Efficient queries
- Proper indexing
- Connection pooling
- Resource optimization

### Data Growth

- Monthly partitioning
- Archive old data
- Efficient storage
- Query optimization

---

## 📈 Future Enhancements

### Planned Features

1. **Telemedicine** - Video consultations
2. **Mobile App** - Patient mobile app
3. **AI Integration** - Diagnosis assistance
4. **Analytics Dashboard** - Advanced reporting
5. **Inventory Management** - Medicine stock tracking
6. **Insurance Integration** - Claims processing
7. **Appointment Reminders** - SMS/Email notifications
8. **Multi-language Support** - Internationalization

### Technical Improvements

1. **Zod v4 Migration** - Replace Yup validation
2. **Redis Integration** - Full caching layer
3. **Microservices** - Service separation
4. **GraphQL** - Alternative API layer
5. **WebSockets** - Enhanced real-time features

---

**End of Documentation**
