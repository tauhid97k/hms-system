# Backend Session Implementation Plan

## ✅ COMPLETED: Frontend Cleanup

- ✅ Removed `initiatedBy` from ALL frontend schemas
- ✅ Removed `initiatedBy` from ALL frontend forms
- ✅ Frontend NEVER sends `initiatedBy`

## 🔧 TODO: Backend Router Updates

### Pattern to Follow:

```typescript
import { getSession } from "@/lib/auth";

export const someRoute = os
  .route({ method: "POST", path: "/something" })
  .input(someSchema) // Schema does NOT have initiatedBy
  .handler(async ({ input }) => {
    // Get session
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Add initiatedBy from session
    return await prisma.something.create({
      data: {
        ...input,
        initiatedBy: session.user.id, // ✅ Added in backend
      }
    });
  });
```

### Routers to Update:

#### 1. `router/appointments.ts`

- ✅ `createAppointment` - Add `initiatedBy: session.user.id`
- ✅ `createAppointmentWithNewPatient` - Add `initiatedBy: session.user.id` for both patient and appointment
- ✅ `updateAppointmentStatus` - Add `initiatedBy: session.user.id`
- ✅ `callNextPatient` - Add `initiatedBy: session.user.id`

#### 2. `router/payments.ts`

- ✅ `createPayment` - Add `initiatedBy: session.user.id`

#### 3. `router/prescriptions.ts`

- ✅ `createPrescription` - Add `initiatedBy: session.user.id`

#### 4. `router/patients.ts`

- ✅ `createPatient` - Add `initiatedBy: session.user.id`

#### 5. `router/bills.ts`

- Check if any bill creation needs `initiatedBy`

## 🚫 NEVER DO:

- ❌ Add `initiatedBy` to frontend schemas
- ❌ Add `initiatedBy` to frontend forms
- ❌ Pass `initiatedBy` from client
- ❌ Trust client-provided user IDs

## ✅ ALWAYS DO:

- ✅ Get `initiatedBy` from `session.user.id` in backend
- ✅ Add `initiatedBy` in router handlers
- ✅ Validate session exists before using
