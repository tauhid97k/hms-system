# 🎯 HMS System - Comprehensive Improvement Plan

**Date:** November 17, 2025  
**Status:** Planning Phase  
**Priority:** High

---

## 📋 Executive Summary

This document outlines all identified issues, inconsistencies, and planned improvements for the HMS system. The plan is organized by priority and includes detailed implementation steps.

---

## 🚨 Critical Issues (Fix Immediately)

### 1. ❌ Prescription Duplicate Prevention

**Issue:** No unique constraint on `prescriptions.appointmentId`

**Risk:** Multiple prescriptions can be created for same appointment

**Fix:**

```prisma
// prisma/schema.prisma
model prescriptions {
  // ... existing fields

  @@unique([appointmentId]) // ADD THIS
}
```

**Migration:**

```bash
npx prisma migrate dev --name add-unique-prescription-constraint
```

---

### 2. ❌ Router Inconsistency

**Issue:** Prescriptions router doesn't follow pagination pattern

**Current:**

```typescript
// ❌ Returns direct array
export const getPrescriptionsByPatient = os
  .handler(async ({ input }) => {
    return prescriptions; // No pagination
  });
```

**Fix:**

```typescript
// ✅ Consistent with other routers
export const getPrescriptionsByPatient = os
  .input(
    paginationSchema.extend({
      patientId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { skip, take, page, limit } = getPaginationQuery(input);

    const [prescriptions, total] = await prisma.$transaction([
      prisma.prescriptions.findMany({ where, skip, take }),
      prisma.prescriptions.count({ where })
    ]);

    return {
      data: prescriptions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  });
```

**Files to Update:**

- `router/prescriptions.ts`
- Any components using this router

---

### 3. ❌ Input Validation Error

**Issue:** Medicine/instruction routers require `search` parameter but it's optional in schema

**Current Error:**

```
Input validation failed at appointments page
```

**Fix:**

```typescript
// schema/paginationSchema.ts - Keep as is

// router/medicines.ts & medicineInstructions.ts
.input(
  paginationSchema.extend({
    search: z.string().default(""), // ✅ Add default
    isActive: z.enum(['true', 'false', 'all']).default("all")
  })
)
```

---

## ⚠️ High Priority Issues

### 4. Type Definitions Scattered

**Issue:** Types defined inline in components instead of centralized

**Found In:**

- `appointments-table.tsx` - Appointment type
- `doctors-table.tsx` - Doctor type
- `patients-table.tsx` - Patient type
- `bills-table.tsx` - Bill type

**Fix:** Move all to `/lib/dataTypes.ts`

```typescript
// lib/dataTypes.ts

// Base types (from Prisma)
export type Patient = { ... };
export type Appointment = { ... };
export type Employee = { ... };

// Extended types for specific views
export type AppointmentTableRow = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: AppointmentStatus;
  patient: {
    name: string;
    age: number;
    gender: Gender | null;
  };
  doctor: {
    name: string;
    department: string;
  };
};

// View-specific types
export type AppointmentForPrescription = { ... };
export type QueueAppointment = { ... };
```

**Action Items:**

1. Extract all inline types
2. Move to dataTypes.ts
3. Update imports in all files
4. Remove duplicate definitions

---

### 5. Modal/Dialog Pattern Inconsistency

**Issue:** Some modals use conditional rendering (bad pattern)

**Bad Pattern Found:**

```typescript
// ❌ BAD
{selectedItem && <SomeDialog open={true} item={selectedItem} />}
```

**Why Bad:**

- Dialog unmounts/remounts on every open/close
- Loses internal state
- Re-runs initialization
- Poor performance

**Standard Pattern:**

```typescript
// ✅ GOOD
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

    {/* Always rendered */}
    <SomeDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      item={selectedItem}
    />
  </>
);
```

**Files to Audit:**

- All `*-dialog.tsx` files
- All `*-modal.tsx` files
- Parent components using dialogs

---

### 6. Safe Client Usage Inconsistency

**Issue:** Some client components use unsafe `client` instead of `safeClient`

**Rule:**

- **Server Components:** Use `client` directly
- **Client Components:** Use `createSafeClient(client)`

**Audit Needed:**

```bash
# Find all client components using client
grep -r "import { client }" app/ --include="*.tsx"
```

**Fix Pattern:**

```typescript
// ❌ BAD (in client component)
import { client } from "@/lib/orpc";

// ✅ GOOD (in client component)
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";

const safeClient = createSafeClient(client);
```

---

## 📊 Medium Priority Improvements

### 7. Yup → Zod v4 Migration

**Why Migrate:**

- ✅ Better TypeScript integration
- ✅ Better error messages
- ✅ Better performance
- ✅ oRPC native support
- ✅ More powerful transformations

**Migration Plan:**

#### Phase 1: Setup (Week 1)

```bash
npm install zod@^4.0.0
npm install @orpc/zod
```

#### Phase 2: Core Schemas (Week 1)

1. `paginationSchema.ts`
2. `patientSchema.ts`
3. `appointmentSchema.ts`

#### Phase 3: Medical Schemas (Week 2)

1. `prescriptionSchema.ts`
2. `medicineSchema.ts`
3. `testSchema.ts`

#### Phase 4: Administrative Schemas (Week 3)

1. `departmentSchema.ts`
2. `employeeSchema.ts`
3. `billingSchema.ts`

**Example Migration:**

```typescript
// BEFORE (Yup)
import { object, string, number } from 'yup';

export const createPatientSchema = object({
  name: string().required(),
  age: number().required().min(0),
  phone: string().required(),
});

// AFTER (Zod)
import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().nonnegative(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone"),
});
```

---

### 8. Missing Prisma Indexes

**Issue:** Some frequently queried fields lack indexes

**Add These:**

```prisma
model appointments {
  // Existing indexes...

  // ADD:
  @@index([patientId, createdAt]) // Patient history with sorting
  @@index([doctorId, appointmentDate, status]) // Doctor's daily queue
}

model bills {
  // ADD:
  @@index([status, dueDate]) // Overdue bills
  @@index([patientId, billingDate]) // Patient billing history
}

model medicines {
  // ADD:
  @@index([name, isActive]) // Active medicine search
  @@index([stock, minStock]) // Low stock alerts
}

model prescriptions {
  // ADD:
  @@unique([appointmentId]) // CRITICAL: Prevent duplicates
}
```

**Migration:**

```bash
npx prisma migrate dev --name add-missing-indexes
```

---

### 9. Missing Prisma Fields

**Issue:** Some useful fields are missing

**Add These:**

```prisma
model appointments {
  // ADD:
  cancelledAt   DateTime?
  cancelReason  String?
  rescheduledFrom String? // Original appointment ID
}

model prescriptions {
  // ADD:
  updatedAt DateTime @updatedAt // Track modifications
}

model test_orders {
  // ADD:
  sampleCollectedAt DateTime?
  sampleCollectedBy String? // References employees.id
}

model patients {
  // ADD:
  deletedAt DateTime? // Soft delete
  @@index([isActive, deletedAt])
}
```

---

### 10. Error Handling Standardization

**Issue:** Inconsistent error handling across routers

**Current:**

```typescript
// Some throw raw errors
throw new Error("Not found");

// Some return errors
return { error: "Not found" };
```

**Standard Pattern:**

```typescript
import { TRPCError } from '@trpc/server';

// In routers:
if (!resource) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Resource not found',
  });
}

if (validationFails) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Validation failed',
    cause: validationErrors,
  });
}
```

---

## 🔄 Redis Integration Plan

### 11. Queue State in Redis

**Current:** In-memory (lost on restart)

**Needed:** Persistent queue state

**Implementation:**

```typescript
// lib/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);
export const publisher = redis.duplicate();
export const subscriber = redis.duplicate();

// lib/queue.ts
export class AppointmentQueue {
  private doctorId: string;
  private date: string;
  private queueKey: string;

  constructor(doctorId: string, date: string) {
    this.doctorId = doctorId;
    this.date = date;
    this.queueKey = `queue:doctor:${doctorId}:${date}`;
  }

  async addToQueue(appointmentId: string, position: number) {
    // Store as sorted set (score = position)
    await redis.zadd(this.queueKey, position, appointmentId);

    // Publish update
    await publisher.publish(
      `queue:${this.doctorId}`,
      JSON.stringify({ type: 'ADDED', appointmentId, position })
    );
  }

  async getQueue() {
    // Get all appointments in order
    const appointmentIds = await redis.zrange(this.queueKey, 0, -1);

    // Fetch full appointment data
    return await prisma.appointments.findMany({
      where: { id: { in: appointmentIds } },
      include: { patient: true, doctor: { include: { user: true } } }
    });
  }

  async updatePosition(appointmentId: string, newPosition: number) {
    await redis.zadd(this.queueKey, newPosition, appointmentId);

    await publisher.publish(
      `queue:${this.doctorId}`,
      JSON.stringify({ type: 'POSITION_CHANGED', appointmentId, newPosition })
    );
  }

  async removeFromQueue(appointmentId: string) {
    await redis.zrem(this.queueKey, appointmentId);

    await publisher.publish(
      `queue:${this.doctorId}`,
      JSON.stringify({ type: 'REMOVED', appointmentId })
    );
  }

  async callNext() {
    // Get first in queue
    const [appointmentId] = await redis.zrange(this.queueKey, 0, 0);

    if (!appointmentId) return null;

    // Update status
    await prisma.appointments.update({
      where: { id: appointmentId },
      data: { status: 'IN_CONSULTATION' }
    });

    // Remove from queue
    await this.removeFromQueue(appointmentId);

    return appointmentId;
  }
}
```

**SSE Endpoint:**

```typescript
// app/api/queue/stream/[doctorId]/route.ts
export async function GET(request, { params }) {
  const stream = new ReadableStream({
    async start(controller) {
      const sub = redis.duplicate();
      await sub.subscribe(`queue:${params.doctorId}`);

      // Send initial queue state
      const queue = new AppointmentQueue(params.doctorId, format(new Date(), 'yyyy-MM-dd'));
      const initialData = await queue.getQueue();
      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);

      // Listen for updates
      sub.on('message', async (channel, message) => {
        const update = JSON.parse(message);
        const currentQueue = await queue.getQueue();
        controller.enqueue(`data: ${JSON.stringify(currentQueue)}\n\n`);
      });

      // Cleanup
      request.signal.addEventListener('abort', () => {
        sub.unsubscribe();
        sub.quit();
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

---

### 12. Caching Strategy

**Implementation:**

```typescript
// lib/cache.ts
import { redis } from './redis';

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage in routers:
export const getDepartments = os
  .handler(async ({ input }) => {
    return getCached(
      `departments:${input.page}:${input.limit}:${input.isActive}`,
      async () => {
        return await prisma.departments.findMany({ ... });
      },
      300 // 5 minutes
    );
  });

export const updateDepartment = os
  .handler(async ({ input }) => {
    const result = await prisma.departments.update({ ... });

    // Invalidate cache
    await invalidateCache('departments:*');

    return result;
  });
```

---

## 🎨 Code Quality Improvements

### 13. Remove setTimeout/useEffect Where Not Needed

**Issue:** Unnecessary setTimeout and useEffect usage

**Audit:**

```bash
# Find all setTimeout usage
grep -r "setTimeout" app/ lib/ --include="*.ts" --include="*.tsx"

# Find all useEffect usage
grep -r "useEffect" app/ --include="*.tsx"
```

**Guidelines:**

- ❌ Don't use setTimeout for delays in production
- ❌ Don't use useEffect for data fetching (use server components)
- ✅ Use setTimeout only for debouncing/throttling
- ✅ Use useEffect only for side effects (subscriptions, DOM manipulation)

**Example Fixes:**

```typescript
// ❌ BAD: Fetching in useEffect
useEffect(() => {
  fetchData();
}, []);

// ✅ GOOD: Server-side fetching
export default async function Page() {
  const data = await client.getData();
  return <Component data={data} />;
}

// ❌ BAD: setTimeout for reconnection
setTimeout(() => connect(), delay);

// ✅ GOOD: Exponential backoff with jitter
const delay = Math.min(
  baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
  maxDelay
);
```

---

### 14. Consistent Response Format

**Issue:** Some routers return different formats

**Standard Format:**

```typescript
// Success (paginated)
{
  data: [...],
  meta: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}

// Success (single item)
{
  data: { ... }
}

// Error (handled by oRPC)
{
  error: {
    code: "NOT_FOUND",
    message: "Resource not found"
  }
}
```

---

### 15. Search Functionality

**Issue:** Some routers lack search

**Missing Search:**

- `appointments` router
- `bills` router

**Add Search:**

```typescript
// router/appointments.ts
.input(
  paginationSchema.extend({
    search: z.string().optional(), // ADD THIS
    status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']).optional(),
    doctorId: z.string().optional(),
    appointmentDate: z.string().optional(),
  })
)
.handler(async ({ input }) => {
  const where: Prisma.appointmentsWhereInput = {};

  // ADD THIS
  if (input.search) {
    where.OR = [
      { patient: { name: { contains: input.search, mode: 'insensitive' } } },
      { patient: { patientId: { contains: input.search, mode: 'insensitive' } } },
      { patient: { phone: { contains: input.search, mode: 'insensitive' } } },
    ];
  }

  // ... rest of handler
});
```

---

## 📝 Documentation Improvements

### 16. Consolidate MD Files

**Current:** 25 MD files (too many!)

**New Structure:**

1. `PROJECT_OVERVIEW.md` - Complete system documentation
2. `IMPROVEMENT_PLAN.md` - This file (issues & improvements)

**Files to Delete:**

- `BADGE_OUTLINE_VARIANT.md` - UI detail (not needed)
- `BUILD_ERROR_FIX.md` - Temporary fix doc
- `FILE_RESTRUCTURE_SUMMARY.md` - Old migration doc
- `IMPLEMENTATION_SUMMARY.md` - Merged into overview
- `MIDDLEWARE_CLEANUP.md` - Completed task
- `ONE_DEPARTMENT_PER_DOCTOR.md` - Implementation detail
- `ORPC_SSE_MIGRATION_COMPLETE.md` - Completed migration
- `ORPC_SSE_MIGRATION_PLAN.md` - Completed plan
- `PRESCRIPTION_FEATURE_PLAN.md` - Merged into overview
- `PRESCRIPTION_IMPLEMENTATION_SUMMARY.md` - Merged
- `QUEUE_EMITTER_MIGRATION.md` - Completed
- `ROUTER_FIXES_SUMMARY.md` - Merged
- `SCHEMA_REVIEW_AND_NEXT_PHASE.md` - Merged
- `SELECT_COMPONENT_AND_DEPARTMENT_UI_UPDATE.md` - UI detail
- `SELECT_VS_ADVANCED_SELECT.md` - Component doc
- `SERVICES_REVIEW_AND_IMPROVEMENTS.md` - Merged
- `SSE_SCALING_QUICK_REFERENCE.md` - Merged into overview
- `VERTICAL_SCALING_GUIDE.md` - Merged into overview
- `event-sourcing-and-queue-analysis.md` - Merged
- `scalability-analysis.md` - Merged
- `scalability-implementation-guide.md` - Merged

**Keep:**

- `PROJECT_OVERVIEW.md` - Main documentation
- `IMPROVEMENT_PLAN.md` - This file
- `DATABASE_DESIGN.md` - Merge into PROJECT_OVERVIEW
- `EVENT_DRIVEN_ARCHITECTURE.md` - Merge into PROJECT_OVERVIEW
- `COMPREHENSIVE_ANALYSIS_REPORT.md` - Merge into IMPROVEMENT_PLAN
- `REDIS_PUBSUB_IMPLEMENTATION.md` - Merge into IMPROVEMENT_PLAN

---

## 📅 Implementation Timeline

### Week 1: Critical Fixes

- [ ] Add unique constraint to prescriptions
- [ ] Fix prescription router pagination
- [ ] Fix input validation errors
- [ ] Standardize modal patterns
- [ ] Audit safe client usage

### Week 2: Type System

- [ ] Extract all inline types
- [ ] Centralize in dataTypes.ts
- [ ] Update all imports
- [ ] Remove duplicates

### Week 3: Zod Migration (Phase 1)

- [ ] Install Zod v4
- [ ] Migrate pagination schema
- [ ] Migrate patient schema
- [ ] Migrate appointment schema

### Week 4: Zod Migration (Phase 2)

- [ ] Migrate prescription schema
- [ ] Migrate medicine schema
- [ ] Migrate test schema

### Week 5: Zod Migration (Phase 3)

- [ ] Migrate department schema
- [ ] Migrate employee schema
- [ ] Migrate billing schema
- [ ] Update all routers

### Week 6: Database Improvements

- [ ] Add missing indexes
- [ ] Add missing fields
- [ ] Run migrations
- [ ] Test performance

### Week 7: Redis Integration (Phase 1)

- [ ] Setup Redis
- [ ] Implement queue management
- [ ] Update SSE endpoints
- [ ] Test real-time updates

### Week 8: Redis Integration (Phase 2)

- [ ] Implement caching layer
- [ ] Add cache invalidation
- [ ] Update routers
- [ ] Performance testing

### Week 9: Code Quality

- [ ] Remove unnecessary setTimeout
- [ ] Remove unnecessary useEffect
- [ ] Standardize error handling
- [ ] Add search to missing routers

### Week 10: Testing & Documentation

- [ ] Integration testing
- [ ] Performance testing
- [ ] Update documentation
- [ ] Clean up MD files

---

## ✅ Success Criteria

### Performance

- [ ] Page load < 2 seconds
- [ ] API response < 500ms
- [ ] Real-time updates < 100ms latency
- [ ] Support 100+ concurrent users

### Code Quality

- [ ] 100% TypeScript coverage
- [ ] No inline types
- [ ] Consistent patterns across all files
- [ ] All routers follow same structure

### Reliability

- [ ] No duplicate prescriptions
- [ ] Queue state persists across restarts
- [ ] Proper error handling everywhere
- [ ] Auto-reconnection works

### Maintainability

- [ ] Clear documentation
- [ ] Consistent code style
- [ ] Easy to add new features
- [ ] Easy to onboard new developers

---

## 🎯 Priority Matrix

### P0 (Critical - Do First)

1. Prescription unique constraint
2. Input validation fixes
3. Router consistency

### P1 (High - Do Soon)

4. Type centralization
5. Modal pattern fixes
6. Safe client audit

### P2 (Medium - Plan & Execute)

7. Zod migration
8. Missing indexes
9. Missing fields
10. Error handling

### P3 (Nice to Have)

11. Redis queue
12. Caching layer
13. Code cleanup
14. Search additions

---

## 📊 Progress Tracking

| Task                           | Status         | Priority | Assigned | Due Date |
| ------------------------------ | -------------- | -------- | -------- | -------- |
| Prescription unique constraint | 🟢 Completed   | P0       | -        | ✅ Done  |
| Input validation fix           | 🟢 Completed   | P0       | -        | ✅ Done  |
| Router consistency             | 🟢 Completed   | P0       | -        | ✅ Done  |
| Type centralization            | 🟢 Completed   | P1       | -        | ✅ Done  |
| Modal pattern audit            | 🟢 Completed   | P1       | -        | ✅ Done  |
| Safe client audit              | 🟢 Completed   | P1       | -        | ✅ Done  |
| Zod migration                  | 🔴 Not Started | P2       | -        | Week 3-5 |
| Redis integration              | 🔴 Not Started | P3       | -        | Week 7-8 |

---

## 🔍 Audit Checklist

### Router Audit

- [ ] All routers use paginationSchema
- [ ] All routers return {data, meta} format
- [ ] All routers have search (where applicable)
- [ ] All routers have status filter
- [ ] All routers use Zod validation
- [ ] All routers have consistent error handling

### Component Audit

- [ ] All types imported from dataTypes.ts
- [ ] All modals use consistent pattern
- [ ] All client components use safeClient
- [ ] All server components use client
- [ ] No unnecessary useEffect
- [ ] No unnecessary setTimeout

### Database Audit

- [ ] All frequently queried fields indexed
- [ ] All unique constraints in place
- [ ] All foreign keys have indexes
- [ ] All soft delete fields present
- [ ] All audit fields present (createdAt, updatedAt)

### Documentation Audit

- [ ] PROJECT_OVERVIEW.md complete
- [ ] IMPROVEMENT_PLAN.md up to date
- [ ] Old MD files deleted
- [ ] Code comments where needed
- [ ] API documentation complete

---

**End of Improvement Plan**

_This is a living document. Update as tasks are completed and new issues are discovered._
