# Schema Audit Trail Analysis

**Date:** November 19, 2025  
**Purpose:** Identify all places where we should use `userId` instead of `employeeId` for proper audit trails

---

## 🎯 **Core Principle**

**Every action should be traced to a USER, not an EMPLOYEE**

### **Why?**

1. ✅ **Users are the base entity** - they login, have permissions
2. ✅ **Employees are optional profiles** - not all users are employees
3. ✅ **Audit logs need user tracing** - who did what, when
4. ✅ **Permission system works on users** - not employee profiles
5. ✅ **Simpler queries** - direct user reference, no joins needed

---

## 🔍 **Current Issues Found**

### **1. ❌ Appointments - `doctorId` and `assignedBy`**

**Current:**

```prisma
model appointments {
  doctorId   String // References employees.id ❌
  assignedBy String // References employees.id ❌

  doctor             employees @relation("DoctorAppointments", fields: [doctorId], references: [id])
  assignedByEmployee employees @relation("AssignedAppointments", fields: [assignedBy], references: [id])
}
```

**Issue:**

- `doctorId` references `employees.id` - but doctors ARE users
- `assignedBy` references `employees.id` - but any user with permission can assign

**Should Be:**

```prisma
model appointments {
  doctorId   String // References users.id ✅
  assignedBy String // References users.id ✅

  doctor       users @relation("DoctorAppointments", fields: [doctorId], references: [id])
  assignedByUser users @relation("AssignedAppointments", fields: [assignedBy], references: [id])
}
```

**Reasoning:**

- Doctors have user accounts (they login)
- Any user with "assign_appointment" permission should be able to assign
- Audit trail: "User X assigned appointment to Doctor Y"

---

### **2. ❌ Appointment Events - `performedBy`**

**Current:**

```prisma
model appointment_events {
  performedBy String? // References employees.id ❌

  performedByEmployee employees? @relation("PerformedBy", fields: [performedBy], references: [id])
}
```

**Issue:**

- Events like "PAYMENT_RECEIVED", "DOCUMENT_UPLOADED" can be done by any user
- Not limited to employees

**Should Be:**

```prisma
model appointment_events {
  performedBy String? // References users.id ✅

  performedByUser users? @relation("PerformedBy", fields: [performedBy], references: [id])
}
```

**Reasoning:**

- Any user with permission can perform actions
- Audit trail: "User X performed action Y at time Z"

---

### **3. ❌ Prescriptions - `doctorId`**

**Current:**

```prisma
model prescriptions {
  doctorId String // References employees.id ❌

  doctor employees @relation(fields: [doctorId], references: [id])
}
```

**Issue:**

- Doctors are users who can prescribe
- Should trace to user, not employee profile

**Should Be:**

```prisma
model prescriptions {
  doctorId String // References users.id ✅

  doctor users @relation("DoctorPrescriptions", fields: [doctorId], references: [id])
}
```

**Reasoning:**

- Doctors login as users
- Prescription audit: "User X (Doctor) prescribed medicine Y"

---

### **4. ❌ Test Orders - `orderedBy`**

**Current:**

```prisma
model test_orders {
  orderedBy String // References employees.id ❌

  orderedByEmployee employees @relation("OrderedBy", fields: [orderedBy], references: [id])
}
```

**Issue:**

- Any authorized user (doctor, nurse) can order tests
- Not limited to employee profiles

**Should Be:**

```prisma
model test_orders {
  orderedBy String // References users.id ✅

  orderedByUser users @relation("OrderedBy", fields: [orderedBy], references: [id])
}
```

**Reasoning:**

- Test ordering is a user action with permissions
- Audit trail: "User X ordered test Y for patient Z"

---

### **5. ❌ Test Results - `technicianId` and `reviewedBy`**

**Current:**

```prisma
model test_results {
  technicianId String  // References employees.id ❌
  reviewedBy   String? // References employees.id ❌

  technician employees  @relation("Technician", fields: [technicianId], references: [id])
  reviewer   employees? @relation("Reviewer", fields: [reviewedBy], references: [id])
}
```

**Issue:**

- Lab technicians are users who login
- Reviewers (doctors/pathologists) are users
- Should trace to user accounts

**Should Be:**

```prisma
model test_results {
  technicianId String  // References users.id ✅
  reviewedBy   String? // References users.id ✅

  technician users  @relation("Technician", fields: [technicianId], references: [id])
  reviewer   users? @relation("Reviewer", fields: [reviewedBy], references: [id])
}
```

**Reasoning:**

- Lab work is done by users with "lab_technician" role
- Review is done by users with "pathologist" or "doctor" role
- Audit trail: "User X performed test, User Y reviewed"

---

### **6. ✅ Payments - `receivedBy` (ALREADY FIXED)**

**Current (Fixed):**

```prisma
model payments {
  receivedBy String? // References users.id ✅

  receivedByUser users? @relation("ReceivedPayments", fields: [receivedBy], references: [id])
}
```

**Status:** ✅ Already correct!

---

## 📊 **Summary of Changes Needed**

| Table                | Field          | Current        | Should Be  | Priority  |
| -------------------- | -------------- | -------------- | ---------- | --------- |
| `appointments`       | `doctorId`     | `employees.id` | `users.id` | 🔴 HIGH   |
| `appointments`       | `assignedBy`   | `employees.id` | `users.id` | 🔴 HIGH   |
| `appointment_events` | `performedBy`  | `employees.id` | `users.id` | 🔴 HIGH   |
| `prescriptions`      | `doctorId`     | `employees.id` | `users.id` | 🔴 HIGH   |
| `test_orders`        | `orderedBy`    | `employees.id` | `users.id` | 🟡 MEDIUM |
| `test_results`       | `technicianId` | `employees.id` | `users.id` | 🟡 MEDIUM |
| `test_results`       | `reviewedBy`   | `employees.id` | `users.id` | 🟡 MEDIUM |
| `payments`           | `receivedBy`   | `users.id`     | `users.id` | ✅ DONE   |

---

## 🎯 **Recommended Approach**

### **Option 1: Keep Both (Hybrid Approach)**

For some tables, we might want BOTH:

- `userId` - for audit trail (who did it)
- `employeeId` - for business logic (doctor's fee, department, etc.)

**Example:**

```prisma
model appointments {
  doctorUserId   String // References users.id - for audit/permissions ✅
  doctorEmployee String // References employees.id - for business data ✅

  doctorUser     users     @relation("DoctorAppointments", fields: [doctorUserId], references: [id])
  doctorProfile  employees @relation("DoctorProfiles", fields: [doctorEmployee], references: [id])
}
```

**Pros:**

- ✅ Clear audit trail (userId)
- ✅ Access to employee data (fees, department)
- ✅ Flexible for non-employee users

**Cons:**

- ❌ More fields
- ❌ Need to keep in sync

---

### **Option 2: Use Only userId (Recommended)**

**Simpler approach:**

```prisma
model appointments {
  doctorId String // References users.id ✅

  doctor users @relation("DoctorAppointments", fields: [doctorId], references: [id])
}
```

**Access employee data via relation:**

```typescript
// In code
const appointment = await prisma.appointments.findUnique({
  where: { id },
  include: {
    doctor: {
      include: {
        employeeProfile: true // Get employee data if exists
      }
    }
  }
})

// Access: appointment.doctor.employeeProfile?.consultationFee
```

**Pros:**

- ✅ Simpler schema
- ✅ Clear audit trail
- ✅ Works for non-employees
- ✅ Easy to query

**Cons:**

- ❌ Extra join for employee data (but cached/optimized)

---

## 🚀 **Migration Strategy**

### **Phase 1: Critical Tables (Do First)**

1. `appointments` - most used, critical for operations
2. `appointment_events` - audit trail foundation
3. `prescriptions` - medical records, legal requirement

### **Phase 2: Lab Tables (Do Second)**

4. `test_orders` - lab workflow
5. `test_results` - lab results tracking

### **Phase 3: Verify**

6. Update all routers to use `session.user.id`
7. Update seed file
8. Test all flows

---

## 📝 **Implementation Steps**

### **1. Update Schema**

```bash
# Edit prisma/schema.prisma
# Change all employee references to user references
```

### **2. Create Migration**

```bash
npx prisma migrate dev --name change_all_employee_refs_to_user_refs
```

### **3. Update Seed File**

```typescript
// Change all:
assignedBy: employee.id
// To:
assignedBy: employee.userId
```

### **4. Update Routers**

```typescript
// Change all:
doctorId: input.employeeId
// To:
doctorId: session.user.id
```

### **5. Test Everything**

- Appointments creation
- Prescriptions
- Test orders
- Payment flow
- Audit logs

---

## 🎯 **Audit Log Benefits**

Once all tables use `userId`, you can easily build audit logs:

```typescript
// Get all actions by a user
const userActions = await prisma.$queryRaw`
  SELECT 'appointment' as type, createdAt, 'assigned' as action
  FROM appointments WHERE assignedBy = ${userId}

  UNION ALL

  SELECT 'payment' as type, paymentDate, 'received' as action
  FROM payments WHERE receivedBy = ${userId}

  UNION ALL

  SELECT 'test' as type, orderedAt, 'ordered' as action
  FROM test_orders WHERE orderedBy = ${userId}

  ORDER BY createdAt DESC
`;
```

---

## ✅ **Recommendation**

**Use Option 2 (userId only) because:**

1. ✅ Simpler schema
2. ✅ Clear audit trail
3. ✅ Works with future permission system
4. ✅ Employee data accessible via relation
5. ✅ Consistent across all tables

**Next Step:** Should I create the migration to fix all these tables?
