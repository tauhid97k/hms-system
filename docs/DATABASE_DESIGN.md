# 🏥 HMS Database Design - Production Ready & Scalable

## 📋 Table of Contents
1. [Overview](#overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Schema Structure](#schema-structure)
4. [Scalability Features](#scalability-features)
5. [Complete Workflow](#complete-workflow)
6. [Performance Optimization](#performance-optimization)
7. [Migration Guide](#migration-guide)

---

## 📊 Overview

**Total Models:** 27
**Total Indexes:** 70+
**Database:** PostgreSQL
**ORM:** Prisma

This schema supports the complete hospital management workflow from patient registration through billing, prescriptions, lab tests, and reporting. Designed to handle **1000+ daily patients** with years of data retention.

---

## 🎯 Key Design Decisions

### **1. Flexible Role & Permission System** ✅

**Why:** Hospitals have diverse and evolving staff structures that can't be hardcoded.

**Solution:** Dynamic RBAC (Role-Based Access Control)

```prisma
model roles {
  id          String   @id @default(ulid())
  name        String   @unique
  slug        String   @unique
  description String?
  isSystem    Boolean  @default(false) // Protect SUPER_ADMIN, DOCTOR, etc.
  isActive    Boolean  @default(true)
}

model permissions {
  id          String   @id @default(ulid())
  name        String   @unique
  slug        String   @unique
  module      String   // "patients", "visits", "billing", "labs"
}

model role_permissions {
  roleId       String
  permissionId String
  // Many-to-many: One role can have multiple permissions
}

model user_roles {
  userId String
  roleId String
  // Many-to-many: One user can have multiple roles
}
```

**Benefits:**
- ✅ Unlimited custom roles (e.g., "Cardiac Specialist", "Senior Nurse")
- ✅ Users can have multiple roles simultaneously
- ✅ Granular permissions per module
- ✅ No schema changes needed for new roles

**Example:**
```sql
-- User can be both Doctor AND Department Head
INSERT INTO user_roles (userId, roleId) VALUES (user1, doctorRole);
INSERT INTO user_roles (userId, roleId) VALUES (user1, deptHeadRole);
```

---

### **2. Polymorphic Billing System** ✅

**Why:** Need to bill for ANY type of service without schema changes.

**Solution:** Laravel-style polymorphic relations using type + ID pattern

```prisma
model bills {
  billableType String? // "visit" | "test" | "medicine" | "surgery" | "any-future-type"
  billableId   String? // ID of the billable entity
}

model bill_items {
  itemableType String // "consultation" | "test" | "medicine" | "service"
  itemableId   String // ID of the item (test_order.id, medicine.id, etc.)
}
```

**Benefits:**
- ✅ Bill anything without modifying schema
- ✅ Same billing logic for all types
- ✅ Easy reporting across bill types
- ✅ Future-proof (room charges, surgeries, etc.)

**Example Use Cases:**
```sql
-- Consultation bill
INSERT INTO bills (billableType, billableId, ...)
VALUES ('visit', visit_id, ...);

-- Test bill
INSERT INTO bills (billableType, billableId, ...)
VALUES ('test', test_order_id, ...);

-- Future: Surgery bill
INSERT INTO bills (billableType, billableId, ...)
VALUES ('surgery', surgery_id, ...);
```

---

### **3. Scalability for High Volume** ✅

**Challenge:** Handle 1000+ patients/day = 30K visits/month = 360K visits/year

**Solutions:**

#### **A. Time-based Partitioning Ready**
```prisma
model visits {
  visitDate  DateTime
  visitMonth String    // "2024-01" for partitioning
}
```

**PostgreSQL Partitioning (Future):**
```sql
-- Partition by month
CREATE TABLE visits_2024_01 PARTITION OF visits
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Query only current month (fast)
SELECT * FROM visits WHERE visitMonth = '2024-01';
```

#### **B. Strategic Indexes (70+)**

**High-Traffic Queries:**
```prisma
// Queue operations (hundreds per minute)
visits {
  @@index([doctorId, visitDate, queuePosition])
  @@index([status, visitDate])
}

// Patient lookups (constant)
patients {
  @@index([patientId])
  @@index([phone])
  @@index([name])
}

// Billing (frequent)
bills {
  @@index([patientId, status])
  @@index([status, billingDate])
}

// Lab workflow (high volume)
test_orders {
  @@index([testTypeId, status])
  @@index([status, orderedAt])
}
```

#### **C. Archiving Strategy**
```prisma
// Soft delete support
patients { isActive Boolean @default(true) }
doctors { isActive Boolean @default(true) }
medicines { isActive Boolean @default(true) }

// Archive old data
-- Move visits >6 months to archive table
-- Keep main table lean for fast queries
```

#### **D. Audit Logging**
```prisma
model audit_logs {
  userId    String?
  action    String    // "create", "update", "delete"
  entity    String    // "patient", "visit", "bill"
  entityId  String?
  changes   Json?     // { before: {...}, after: {...} }
  ipAddress String?
  createdAt DateTime
}
```

**Use Cases:**
- Compliance (HIPAA, data protection)
- Debugging data issues
- Security audits
- Track who modified critical records

---

## 🗂️ Schema Structure (27 Models)

### **Authentication & Access Control** (6 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Staff, doctors, admin | No hardcoded role, multi-department |
| `sessions` | Login sessions | Auto-expire tracking |
| `roles` | Dynamic roles | System vs custom roles |
| `permissions` | Granular permissions | Module-based organization |
| `role_permissions` | Role → Permission | Many-to-many mapping |
| `user_roles` | User → Role | Multiple roles per user |

### **Core Hospital** (4 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `departments` | Hospital departments | Active/inactive support |
| `doctors` | Doctor profiles | Consultation + hospital fees |
| `patients` | Patient records | Auto-generated patient ID (P-2024-0001) |
| `visits` | Appointments/visits | Queue management, monthly partitioning |

### **Billing & Finance** (5 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `bills` | Patient bills | Polymorphic billable, discount support |
| `bill_items` | Line items | Polymorphic items, quantity tracking |
| `payments` | Payment records | Multiple methods (CASH primary), partial payments |
| `accounts` | Financial accounts | Flexible account types |
| `transactions` | Account transactions | Full audit trail |

### **Prescriptions** (4 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `medicines` | Medicine database | Stock tracking, low stock alerts |
| `medicine_instructions` | Dosage presets | 1+1+1, 1+0+1, etc. |
| `prescriptions` | Prescription records | Follow-up date support |
| `prescription_items` | Medicines in Rx | Duration, custom notes |

### **Lab & Tests** (6 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `labs` | Lab departments | Department linkage |
| `test_types` | Available tests | Price, template linkage |
| `test_templates` | Form builder | JSON schema for dynamic forms |
| `test_orders` | Ordered tests | Priority support (urgent, stat) |
| `test_results` | Test results | Review workflow, delivery tracking |

### **Supporting** (5 models)
| Model | Purpose | Key Features |
|-------|---------|--------------|
| `documents` | File uploads (AWS S3) | Patient documents, visit attachments |
| `notifications` | System notifications | Real-time via WebSocket |
| `settings` | App configuration | Key-value store, public/private |
| `audit_logs` | Compliance tracking | Full change history |
| `categories` | Legacy | Will be removed |

---

## 🏥 Complete Hospital Workflow

### **1. Patient Registration**
```typescript
// Create patient with auto-generated ID
const lastPatient = await prisma.patients.findFirst({
  orderBy: { patientId: 'desc' }
})
const nextNumber = lastPatient
  ? parseInt(lastPatient.patientId.split('-').pop()!) + 1
  : 1

const patient = await prisma.patients.create({
  data: {
    patientId: `P-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`,
    name, age, phone, gender, bloodGroup, address
  }
})
// Result: P-2024-0001
```

### **2. Create Visit + Auto-Generate Bill**
```typescript
// 1. Get next serial number for doctor today
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

const lastVisit = await prisma.visits.findFirst({
  where: {
    doctorId,
    visitDate: { gte: todayStart }
  },
  orderBy: { serialNumber: 'desc' }
})

const serialNumber = (lastVisit?.serialNumber || 0) + 1
const visitMonth = format(new Date(), 'yyyy-MM')

// 2. Create visit
const visit = await prisma.visits.create({
  data: {
    patientId, doctorId, assignedBy: currentUser.id,
    visitType, reason,
    serialNumber,
    queuePosition: serialNumber,
    visitMonth,
    status: 'WAITING'
  }
})

// 3. Auto-generate consultation bill
const doctor = await prisma.doctors.findUnique({ where: { id: doctorId } })
const billTotal = doctor.consultationFee + doctor.hospitalFee

const bill = await prisma.bills.create({
  data: {
    billNumber: await generateBillNumber(), // B-2024-0001
    patientId,
    visitId: visit.id,
    billableType: 'visit',
    billableId: visit.id,
    totalAmount: billTotal,
    dueAmount: billTotal,
    billingDate: new Date()
  }
})

await prisma.bill_items.create({
  data: {
    billId: bill.id,
    itemableType: 'consultation',
    itemableId: visit.id,
    itemName: `Dr. ${doctor.user.name} - Consultation`,
    quantity: 1,
    unitPrice: billTotal,
    total: billTotal
  }
})
```

### **3. Queue Management (Real-time)**
```typescript
// Get doctor's queue
const queue = await prisma.visits.findMany({
  where: {
    doctorId,
    visitDate: { gte: todayStart },
    status: { in: ['WAITING', 'IN_CONSULTATION'] }
  },
  include: { patient: true },
  orderBy: { queuePosition: 'asc' }
})

// Update status (WebSocket broadcast)
await prisma.visits.update({
  where: { id: visitId },
  data: {
    status: 'IN_CONSULTATION',
    entryTime: new Date()
  }
})

// Emit WebSocket event
io.to(`doctor:${doctorId}`).emit('queue-update', queue)
```

### **4. Cash Payment (PRIMARY)**
```typescript
// Process cash payment
const payment = await prisma.payments.create({
  data: {
    billId,
    amount,
    paymentMethod: 'CASH',
    receivedBy: currentUser.id,
    status: 'success',
    paymentDate: new Date(),
    notes: 'Cash payment received'
  }
})

// Update bill status
const bill = await prisma.bills.findUnique({ where: { id: billId } })
const newPaidAmount = bill.paidAmount + amount
const newDueAmount = bill.totalAmount - newPaidAmount

await prisma.bills.update({
  where: { id: billId },
  data: {
    paidAmount: newPaidAmount,
    dueAmount: newDueAmount,
    status: newDueAmount === 0 ? 'PAID'
          : newPaidAmount > 0 ? 'PARTIAL'
          : 'PENDING'
  }
})

// Create transaction record
const revenueAccount = await prisma.accounts.findFirst({
  where: { accountType: 'revenue' }
})

await prisma.transactions.create({
  data: {
    accountId: revenueAccount.id,
    paymentId: payment.id,
    amount,
    type: 'CREDIT',
    referenceType: 'bill',
    referenceId: billId,
    description: `CASH payment for ${bill.billNumber}`
  }
})

await prisma.accounts.update({
  where: { id: revenueAccount.id },
  data: { balance: { increment: amount } }
})
```

### **5. Create Prescription**
```typescript
const prescription = await prisma.prescriptions.create({
  data: {
    visitId,
    doctorId: currentUser.id,
    notes,
    followUpDate,
    items: {
      create: medicines.map(med => ({
        medicineId: med.id,
        instructionId: med.instructionId,
        duration: med.duration,
        notes: med.notes
      }))
    }
  }
})
```

### **6. Order Tests**
```typescript
// Doctor orders tests
const testOrders = await prisma.test_orders.createMany({
  data: tests.map(testTypeId => ({
    visitId,
    testTypeId,
    orderedBy: currentUser.id,
    status: 'ORDERED'
  }))
})

// Patient selects tests to pay for
const selectedTests = await prisma.test_orders.findMany({
  where: { id: { in: selectedTestIds } },
  include: { testType: true }
})

// Generate test bill
const testBill = await prisma.bills.create({
  data: {
    billNumber: await generateBillNumber(),
    patientId,
    visitId,
    billableType: 'test',
    totalAmount: selectedTests.reduce((sum, t) => sum + t.testType.price, 0),
    dueAmount: selectedTests.reduce((sum, t) => sum + t.testType.price, 0),
    billItems: {
      create: selectedTests.map(test => ({
        itemableType: 'test',
        itemableId: test.id,
        itemName: test.testType.name,
        quantity: 1,
        unitPrice: test.testType.price,
        total: test.testType.price
      }))
    }
  }
})

// After payment, mark as BILLED
await prisma.test_orders.updateMany({
  where: { id: { in: selectedTestIds } },
  data: { status: 'BILLED', billId: testBill.id }
})
```

### **7. Lab Workflow**
```typescript
// Technician fills results
const testResult = await prisma.test_results.create({
  data: {
    testOrderId,
    technicianId: currentUser.id,
    resultData: dynamicFormData, // JSON from form builder
    status: 'COMPLETED',
    completedAt: new Date()
  }
})

await prisma.test_orders.update({
  where: { id: testOrderId },
  data: { status: 'COMPLETED' }
})

// Manager reviews
await prisma.test_results.update({
  where: { id: testResult.id },
  data: {
    reviewedBy: currentUser.id,
    status: 'REVIEWED',
    reviewNotes
  }
})

// Release all tests for visit
await prisma.test_results.updateMany({
  where: {
    testOrder: { visitId }
  },
  data: {
    status: 'RELEASED',
    releasedAt: new Date()
  }
})

// Mark as delivered
await prisma.test_results.updateMany({
  where: {
    testOrder: { visitId }
  },
  data: {
    status: 'DELIVERED',
    deliveredAt: new Date(),
    deliveredTo: patientSignature
  }
})
```

---

## 🚀 Performance Optimization

### **Query Performance Targets**
- Patient search: <50ms
- Queue load: <100ms
- Bill generation: <200ms
- Daily reports: <500ms
- Monthly reports: <2s

### **Index Strategy**

#### **1. Composite Indexes (Complex Queries)**
```prisma
// Queue in correct order
@@index([doctorId, visitDate, queuePosition])

// Patient's pending bills
@@index([patientId, status])

// Lab-specific queues
@@index([testTypeId, status])

// Unread notifications
@@index([userId, isRead, createdAt])
```

#### **2. Date-based Indexes (Reports)**
```prisma
@@index([visitDate])
@@index([billingDate])
@@index([paymentDate])
@@index([createdAt])
```

#### **3. Polymorphic Indexes**
```prisma
@@index([billableType, billableId])
@@index([itemableType, itemableId])
```

### **Materialized Views (Future)**
```sql
-- Pre-calculate daily stats
CREATE MATERIALIZED VIEW daily_stats AS
SELECT
  visitDate::date as date,
  COUNT(*) as patient_count,
  SUM(b.totalAmount) as revenue
FROM visits v
JOIN bills b ON b.visitId = v.id
WHERE b.status = 'PAID'
GROUP BY visitDate::date;

-- Refresh nightly
REFRESH MATERIALIZED VIEW daily_stats;

-- Fast reports
SELECT * FROM daily_stats WHERE date BETWEEN ? AND ?;
```

---

## 📈 Scalability Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Active Patients | 100K+ | Indexed searches, archiving |
| Daily Visits | 2000+ | Monthly partitioning, indexes |
| Concurrent Users | 200+ | Connection pooling, caching |
| Data Retention | 5+ years | Archiving, partitioning |
| Response Time | <200ms p95 | Strategic indexes, materialized views |

---

## ✅ Migration Guide

### **Run Migration**
```bash
npx prisma migrate dev --name init_hms_v2_production_ready
```

### **Seed Data (After Migration)**
```typescript
// Create default roles
const roles = await prisma.roles.createMany({
  data: [
    { name: 'Super Admin', slug: 'super-admin', isSystem: true },
    { name: 'Admin', slug: 'admin', isSystem: true },
    { name: 'Doctor', slug: 'doctor', isSystem: true },
    { name: 'Staff', slug: 'staff', isSystem: true },
    { name: 'Lab Technician', slug: 'lab-technician', isSystem: true },
    { name: 'Billing Staff', slug: 'billing-staff', isSystem: true },
  ]
})

// Create permissions
const permissions = await prisma.permissions.createMany({
  data: [
    { name: 'View Patients', slug: 'patients.view', module: 'patients' },
    { name: 'Create Patients', slug: 'patients.create', module: 'patients' },
    { name: 'View Bills', slug: 'bills.view', module: 'billing' },
    { name: 'Process Payments', slug: 'payments.process', module: 'billing' },
    // ... more permissions
  ]
})

// Create default accounts
await prisma.accounts.createMany({
  data: [
    { name: 'Cash Account', accountType: 'cash', balance: 0 },
    { name: 'Revenue Account', accountType: 'revenue', balance: 0 },
  ]
})
```

---

## 🔐 Production Checklist

- ✅ Flexible role system (unlimited custom roles)
- ✅ Polymorphic billing (any billable type)
- ✅ 70+ strategic indexes
- ✅ Partitioning ready (monthly)
- ✅ Archiving support (isActive flags)
- ✅ Audit logging (compliance)
- ✅ Stock tracking (medicines)
- ✅ Priority queues (urgent tests)
- ✅ Discount support (bills)
- ✅ Date-based queries optimized
- ✅ Cascade deletes configured
- ✅ Unique constraints enforced
- ✅ Foreign keys validated
- ✅ JSON fields for flexibility
- ✅ All relationships verified

**This schema can handle:**
- ✅ 1000s of daily patients
- ✅ Years of data retention
- ✅ Complex permission structures
- ✅ Any billing scenario
- ✅ Fast concurrent operations
- ✅ Compliance requirements
