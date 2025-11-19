# Appointment & Billing Flow Analysis

## Current System Structure

### ✅ YES - Bills are Auto-Created with Appointments

When an appointment is created, the system automatically:

1. Creates the appointment record
2. Generates a bill with consultation fees
3. Creates bill items for the consultation
4. Logs billing events

**Current Flow:**

```
Create Appointment
    ↓
Auto-generate Bill (status: PENDING)
    ↓
Create Bill Items (consultation fee)
    ↓
Log Events (CONSULTATION_BILLED)
```

---

## Current Status Flow (Prisma Schema)

### AppointmentStatus Enum:

```prisma
enum AppointmentStatus {
  WAITING              // Default when created
  IN_CONSULTATION
  COMPLETED
  CANCELLED
}
```

### BillStatus Enum:

```prisma
enum BillStatus {
  PENDING             // Default when created
  PARTIAL
  PAID
  REFUNDED
  CANCELLED
}
```

---

## 🔴 Issues with Current System

### 1. **No Bill Visibility in Appointments Table**

- "Print Receipt" action exists but doesn't show bill details
- No way to view or manage the bill from appointments list
- No indication of payment status

### 2. **Status Flow Doesn't Match Business Logic**

- Appointments start as "WAITING" regardless of payment
- No way to track payment confirmation
- No "NO_SHOW" status for paid but absent patients

### 3. **Missing Payment Workflow**

- No clear payment confirmation step
- No link between bill payment and appointment progression

---

## 🎯 Proposed New Flow

### New AppointmentStatus Enum:

```prisma
enum AppointmentStatus {
  AWAITING_CONFIRMATION    // Initial status (bill created, not paid)
  WAITING                  // Paid and waiting for consultation
  IN_CONSULTATION          // Currently being consulted
  COMPLETED                // Consultation finished
  NO_SHOW                  // Paid but patient didn't show up
  CANCELLED                // Cancelled (unpaid after timeout via cron)
}
```

### New Appointment Lifecycle:

```
1. CREATE APPOINTMENT
   ↓
   Status: AWAITING_CONFIRMATION
   Bill Status: PENDING
   ↓
   ┌─────────────────┬─────────────────┐
   │                 │                 │
   │  PAID           │  NOT PAID       │
   │  (Manual)       │  (Cron Job)     │
   ↓                 ↓                 ↓
   Status: WAITING   │   Status: CANCELLED
   Bill: PAID        │   Bill: CANCELLED
   ↓                 │
   Patient Arrives?  │
   ┌────────┬────────┤
   │ YES    │ NO     │
   ↓        ↓        │
   IN_CONSULTATION   │
   ↓        Status:  │
   COMPLETED NO_SHOW │
            ↓        │
            (Can reschedule)
```

---

## 📋 Required Changes

### 1. **Update Prisma Schema**

```prisma
enum AppointmentStatus {
  AWAITING_CONFIRMATION
  WAITING
  IN_CONSULTATION
  COMPLETED
  NO_SHOW
  CANCELLED
}
```

### 2. **Replace "Print Receipt" with "Invoice"**

- Change action from "Print Receipt" to "Invoice"
- Add invoice icon (e.g., LuFileText or LuReceipt)
- Open modal with:
  - Bill details (bill number, amount, status)
  - Patient info
  - Doctor info
  - Appointment details (date, serial, queue position)
  - Bill items breakdown
  - Two buttons:
    - **Cancel**: Close modal
    - **Confirm Payment**: Mark bill as PAID and update appointment status

### 3. **Create Invoice Modal Component**

```typescript
// Components needed:
- InvoiceModal.tsx
  - Display bill information
  - Show payment status
  - Confirm payment button (if PENDING)
  - Print invoice functionality
```

### 4. **Update Appointment Creation**

```typescript
// Change default status from WAITING to AWAITING_CONFIRMATION
status: AppointmentStatus.AWAITING_CONFIRMATION
```

### 5. **Create Payment Confirmation Handler**

```typescript
// Router method to confirm payment
confirmPayment(appointmentId, billId)
  - Update bill status to PAID
  - Update appointment status to WAITING
  - Log payment event
  - Update queue if needed
```

### 6. **Add Cron Job for Unpaid Appointments**

```typescript
// Scheduled task to cancel unpaid appointments
// Run every hour or as configured
cancelUnpaidAppointments()
  - Find appointments with status AWAITING_CONFIRMATION
  - Check if created > X hours ago (e.g., 24 hours)
  - Update status to CANCELLED
  - Update bill status to CANCELLED
  - Log cancellation event
```

### 7. **Add NO_SHOW Functionality**

```typescript
// Manual action for paid patients who don't show up
markAsNoShow(appointmentId)
  - Update status to NO_SHOW
  - Keep bill as PAID (already paid)
  - Log no-show event
  - Option to reschedule
```

---

## 🎨 UI Changes Needed

### Appointments Table Dropdown:

```
Current:
- View Patient
- View Doctor
- Prescribe (if IN_CONSULTATION)
- Print Receipt ❌

New:
- View Patient
- View Doctor
- Invoice ✅ (opens modal)
- Prescribe (if IN_CONSULTATION)
```

### Invoice Modal Layout:

```
┌─────────────────────────────────────────┐
│  Invoice #BILL-2025-000123              │
│  ─────────────────────────────────────  │
│                                         │
│  Patient: John Doe (PID25-000001)      │
│  Doctor: Dr. Smith                      │
│  Date: 2025-01-19                       │
│  Serial: #45  Queue: 12                 │
│                                         │
│  Bill Details:                          │
│  ─────────────────────────────────────  │
│  Consultation Fee        $50.00         │
│  Hospital Fee            $10.00         │
│  ─────────────────────────────────────  │
│  Total                   $60.00         │
│  Paid                    $0.00          │
│  Due                     $60.00         │
│                                         │
│  Status: PENDING 🟡                     │
│                                         │
│  [Cancel]  [Confirm Payment] ✅         │
└─────────────────────────────────────────┘
```

---

## 📊 Status Badge Colors

```typescript
AWAITING_CONFIRMATION → Yellow/Orange (⏳ Pending Payment)
WAITING              → Blue (👥 In Queue)
IN_CONSULTATION      → Green (🩺 Active)
COMPLETED            → Gray (✅ Done)
NO_SHOW              → Orange (❌ Absent)
CANCELLED            → Red (🚫 Cancelled)
```

---

## 🔄 Migration Steps

1. Add new status to AppointmentStatus enum
2. Update all appointment creation to use AWAITING_CONFIRMATION
3. Create invoice modal component
4. Update appointments table dropdown
5. Create payment confirmation router method
6. Add cron job for auto-cancellation
7. Update status badge component
8. Test full flow end-to-end

---

## 📝 Notes

- Bills are already linked to appointments via `appointmentId`
- Bill status is independent but should sync with appointment flow
- Payment confirmation should be atomic (update both bill and appointment)
- NO_SHOW allows for rescheduling without refund
- CANCELLED appointments should also cancel associated bills
