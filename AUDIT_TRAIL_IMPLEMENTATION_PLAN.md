# Audit Trail Implementation Plan

**Date:** November 19, 2025  
**Status:** 📋 Planning Phase

---

## 🎯 **Core Strategy**

### **Principle: Separation of Concerns**

1. **Business Relations** - Keep existing `userId`, `doctorId`, etc. for business logic
2. **Audit Tracing** - Add new `initiatedBy` field to track WHO performed the action
3. **Audit Logs** - Use existing `audit_logs` table for detailed change tracking

---

## 📊 **Current State Analysis**

### **Existing Audit Logs Table:**

```prisma
model audit_logs {
  id        String   @id @default(ulid())
  userId    String?  // ✅ Already tracks user
  action    String   // "create", "update", "delete", "login", etc.
  entity    String   // "patient", "visit", "bill", etc.
  entityId  String?
  changes   Json?    // Before/after data
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([entity, entityId])
  @@index([createdAt])
  @@index([action])
}
```

**Status:** ✅ Table exists but not connected to users table

---

## 🔧 **Proposed Solution**

### **Two-Tier Audit System:**

#### **Tier 1: Inline Audit Fields (Quick Trace)**

Add `initiatedBy` to critical tables for quick "who did this" queries

#### **Tier 2: Detailed Audit Logs (Full History)**

Use `audit_logs` table for complete change history with before/after data

---

## 📋 **Tables to Update**

### **Priority 1: Critical Operations (Add `initiatedBy`)**

#### **1. Appointments**

```prisma
model appointments {
  // Existing business fields
  patientId        String
  doctorId         String  // Keep - references employees.id (business logic)
  assignedBy       String  // Keep - references employees.id (who assigned)

  // NEW: Audit field
  initiatedBy      String  // NEW - references users.id (session user who created)

  // Relations
  patient            patients  @relation(fields: [patientId], references: [id])
  doctor             employees @relation("DoctorAppointments", fields: [doctorId], references: [id])
  assignedByEmployee employees @relation("AssignedAppointments", fields: [assignedBy], references: [id])
  initiatedByUser    users     @relation("InitiatedAppointments", fields: [initiatedBy], references: [id])
}
```

**Why Keep Both?**

- `doctorId` → Business: Which doctor is treating (employee profile needed for fees)
- `assignedBy` → Business: Which staff assigned (could be different from creator)
- `initiatedBy` → Audit: Which user created the appointment (session.user.id)

**Use Case:**

```typescript
// Receptionist (User A) creates appointment for Doctor (Employee B)
// Assigned by Supervisor (Employee C)
{
  initiatedBy: session.user.id,  // User A (receptionist who logged in)
  doctorId: doctorEmployee.id,    // Employee B (doctor treating)
  assignedBy: supervisorEmployee.id // Employee C (who assigned)
}
```

---

#### **2. Payments**

```prisma
model payments {
  // Existing
  receivedBy  String?  // Keep - references users.id (who received payment)

  // NEW: Audit field
  initiatedBy String   // NEW - references users.id (who created payment record)

  // Relations
  receivedByUser  users? @relation("ReceivedPayments", fields: [receivedBy], references: [id])
  initiatedByUser users  @relation("InitiatedPayments", fields: [initiatedBy], references: [id])
}
```

**Why Both?**

- `receivedBy` → Business: Who physically received the money (could be NULL for online)
- `initiatedBy` → Audit: Who created the payment record in system

---

#### **3. Prescriptions**

```prisma
model prescriptions {
  // Existing
  doctorId    String  // Keep - references employees.id (prescribing doctor)

  // NEW: Audit field
  initiatedBy String  // NEW - references users.id (who created prescription)

  // Relations
  doctor          employees @relation(fields: [doctorId], references: [id])
  initiatedByUser users     @relation("InitiatedPrescriptions", fields: [initiatedBy], references: [id])
}
```

**Why Both?**

- `doctorId` → Business: Which doctor prescribed (medical/legal requirement)
- `initiatedBy` → Audit: Who entered it in system (could be nurse/assistant)

---

#### **4. Test Orders**

```prisma
model test_orders {
  // Existing
  orderedBy   String  // Keep - references employees.id (doctor who ordered)

  // NEW: Audit field
  initiatedBy String  // NEW - references users.id (who created order)

  // Relations
  orderedByEmployee employees @relation("OrderedBy", fields: [orderedBy], references: [id])
  initiatedByUser   users     @relation("InitiatedTestOrders", fields: [initiatedBy], references: [id])
}
```

---

#### **5. Test Results**

```prisma
model test_results {
  // Existing
  technicianId String   // Keep - references employees.id (lab tech)
  reviewedBy   String?  // Keep - references employees.id (reviewer)

  // NEW: Audit fields
  initiatedBy  String   // NEW - who created result record
  updatedBy    String?  // NEW - who last updated

  // Relations
  technician      employees @relation("Technician", fields: [technicianId], references: [id])
  reviewer        employees? @relation("Reviewer", fields: [reviewedBy], references: [id])
  initiatedByUser users     @relation("InitiatedTestResults", fields: [initiatedBy], references: [id])
  updatedByUser   users?    @relation("UpdatedTestResults", fields: [updatedBy], references: [id])
}
```

---

#### **6. Bills**

```prisma
model bills {
  // NEW: Audit fields
  initiatedBy String   // NEW - who created bill
  updatedBy   String?  // NEW - who last updated

  // Relations
  initiatedByUser users  @relation("InitiatedBills", fields: [initiatedBy], references: [id])
  updatedByUser   users? @relation("UpdatedBills", fields: [updatedBy], references: [id])
}
```

---

#### **7. Appointment Events**

```prisma
model appointment_events {
  // Existing
  performedBy String?  // Keep - references employees.id (who performed action)

  // NEW: Audit field
  initiatedBy String   // NEW - references users.id (who logged the event)

  // Relations
  performedByEmployee employees? @relation("PerformedBy", fields: [performedBy], references: [id])
  initiatedByUser     users      @relation("InitiatedEvents", fields: [initiatedBy], references: [id])
}
```

---

### **Priority 2: Master Data (Add `createdBy` & `updatedBy`)**

#### **8. Patients**

```prisma
model patients {
  // NEW: Audit fields
  createdBy String   // NEW - who registered patient
  updatedBy String?  // NEW - who last updated

  // Relations
  createdByUser users  @relation("CreatedPatients", fields: [createdBy], references: [id])
  updatedByUser users? @relation("UpdatedPatients", fields: [updatedBy], references: [id])
}
```

---

#### **9. Departments, Specializations, etc.**

```prisma
// Add to: departments, specializations, test_types, medicines, etc.
model departments {
  createdBy String
  updatedBy String?

  createdByUser users  @relation("CreatedDepartments", fields: [createdBy], references: [id])
  updatedByUser users? @relation("UpdatedDepartments", fields: [updatedBy], references: [id])
}
```

---

## 🔗 **Update Audit Logs Table**

```prisma
model audit_logs {
  id        String   @id @default(ulid())
  userId    String   // Make required, add relation
  action    String   // "create", "update", "delete", "login", etc.
  entity    String   // "patient", "appointment", "bill", etc.
  entityId  String?
  changes   Json?    // Before/after data
  metadata  Json?    // Additional context (IP, user agent, etc.)
  createdAt DateTime @default(now())

  user users @relation("AuditLogs", fields: [userId], references: [id])  // NEW

  @@index([userId, createdAt])
  @@index([entity, entityId])
  @@index([createdAt])
  @@index([action])
}
```

---

## 📝 **Field Naming Convention**

| Field Name    | Purpose                   | Type                 | When to Use              |
| ------------- | ------------------------- | -------------------- | ------------------------ |
| `initiatedBy` | Who created the record    | `String` (required)  | All transactional tables |
| `updatedBy`   | Who last modified         | `String?` (optional) | Tables with updates      |
| `createdBy`   | Who created (master data) | `String` (required)  | Master data tables       |
| `performedBy` | Who did the action        | `String?` (optional) | Event/action tables      |
| `receivedBy`  | Who received (specific)   | `String?` (optional) | Payment-specific         |
| `orderedBy`   | Who ordered (specific)    | `String` (required)  | Order-specific           |
| `reviewedBy`  | Who reviewed (specific)   | `String?` (optional) | Review workflow          |

---

## 🎯 **Implementation Steps**

### **Phase 1: Schema Updates**

1. **Update `users` model** - Add all new relations
2. **Update transactional tables** - Add `initiatedBy` field
3. **Update master data tables** - Add `createdBy` and `updatedBy`
4. **Update `audit_logs`** - Add user relation

### **Phase 2: Migration**

```bash
# This will be a big migration
npx prisma migrate dev --name add_audit_trail_fields
```

### **Phase 3: Seed File Updates**

Update seed to populate audit fields:

```typescript
// Example
await prisma.appointments.create({
  data: {
    patientId: patient.id,
    doctorId: doctor.id,
    assignedBy: assigner.id,
    initiatedBy: assigner.userId,  // NEW
    // ... other fields
  }
})
```

### **Phase 4: Router Updates**

Update all routers to include `initiatedBy`:

```typescript
// Example: Create appointment
export const createAppointment = os
  .route({ method: "POST", path: "/appointments" })
  .input(createAppointmentSchema)
  .handler(async ({ input, context }) => {
    const session = await getSession();

    const appointment = await prisma.appointments.create({
      data: {
        ...input,
        initiatedBy: session.user.id,  // NEW
      }
    });

    // Also log to audit_logs
    await prisma.audit_logs.create({
      data: {
        userId: session.user.id,
        action: "create",
        entity: "appointment",
        entityId: appointment.id,
        metadata: { /* request details */ }
      }
    });

    return appointment;
  });
```

### **Phase 5: Audit Log Middleware**

Create middleware to auto-log all changes:

```typescript
// lib/audit-middleware.ts
export async function logAudit(
  userId: string,
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  changes?: any
) {
  await prisma.audit_logs.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes,
      metadata: {
        timestamp: new Date(),
        // Add IP, user agent, etc.
      }
    }
  });
}
```

---

## 📊 **Benefits of This Approach**

### **1. Separation of Concerns**

- ✅ Business logic fields remain unchanged
- ✅ Audit fields are separate and clear
- ✅ No confusion between "who did" vs "who is responsible"

### **2. Complete Audit Trail**

```typescript
// Quick inline query
const appointment = await prisma.appointments.findUnique({
  where: { id },
  include: {
    initiatedByUser: true,  // Who created it
    doctor: true,            // Who is treating
    assignedByEmployee: true // Who assigned
  }
});

// Detailed audit log query
const auditTrail = await prisma.audit_logs.findMany({
  where: {
    entity: "appointment",
    entityId: id
  },
  include: { user: true },
  orderBy: { createdAt: 'desc' }
});
```

### **3. Compliance Ready**

- ✅ HIPAA compliance (who accessed what)
- ✅ Legal requirements (who prescribed, who ordered)
- ✅ Financial audit (who created bills, received payments)

### **4. Debugging & Support**

- ✅ "Who created this broken record?"
- ✅ "What changed and when?"
- ✅ "Who has been accessing patient X?"

---

## 🚀 **Migration Strategy**

### **Option A: All at Once (Recommended for Dev)**

1. Update entire schema
2. Reset database
3. Run seed with audit fields
4. Update all routers

### **Option B: Gradual (Production)**

1. Add fields as nullable first
2. Backfill existing data
3. Make required
4. Update routers incrementally

---

## 📋 **Summary of Changes**

### **Tables to Update:**

| Table                | New Fields                 | Relations                          |
| -------------------- | -------------------------- | ---------------------------------- |
| `appointments`       | `initiatedBy`              | `initiatedByUser`                  |
| `payments`           | `initiatedBy`              | `initiatedByUser`                  |
| `prescriptions`      | `initiatedBy`              | `initiatedByUser`                  |
| `test_orders`        | `initiatedBy`              | `initiatedByUser`                  |
| `test_results`       | `initiatedBy`, `updatedBy` | `initiatedByUser`, `updatedByUser` |
| `bills`              | `initiatedBy`, `updatedBy` | `initiatedByUser`, `updatedByUser` |
| `appointment_events` | `initiatedBy`              | `initiatedByUser`                  |
| `patients`           | `createdBy`, `updatedBy`   | `createdByUser`, `updatedByUser`   |
| `departments`        | `createdBy`, `updatedBy`   | `createdByUser`, `updatedByUser`   |
| `specializations`    | `createdBy`, `updatedBy`   | `createdByUser`, `updatedByUser`   |
| `test_types`         | `createdBy`, `updatedBy`   | `createdByUser`, `updatedByUser`   |
| `medicines`          | `createdBy`, `updatedBy`   | `createdByUser`, `updatedByUser`   |
| `audit_logs`         | Add relation               | `user`                             |

### **Users Model Updates:**

Add ~20 new relations for all the audit fields

---

## ✅ **Next Steps**

1. **Review this plan** - Confirm approach
2. **Update schema** - Make all changes
3. **Create migration** - Test in dev
4. **Update seed** - Add audit fields
5. **Update routers** - Add `initiatedBy` everywhere
6. **Create audit middleware** - Auto-logging
7. **Test thoroughly** - All CRUD operations

---

## 🎯 **Decision Required**

**Should I proceed with implementing this plan?**

This will:

- ✅ Keep existing business logic intact
- ✅ Add comprehensive audit trail
- ✅ Enable future compliance features
- ✅ Make debugging much easier
- ⚠️ Require updating ~15 tables
- ⚠️ Require updating all routers
- ⚠️ Require resetting database (dev)

**Estimated Time:** 2-3 hours for complete implementation
