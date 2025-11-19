# Seed Update - Bills & Payments for Appointments

**Date:** November 19, 2025  
**Status:** ✅ Completed

---

## 🎯 Objective

Add bill generation for all appointments in the seed data, including:

- Bills linked to appointments
- Bill items (consultation fee, hospital fee)
- Payment records for paid/partial bills
- Appointment events for payment tracking

---

## ✅ What Was Added

### **1. Bill Creation for Each Appointment**

Every appointment now automatically gets a bill with:

```typescript
{
  billNumber: "BILL-20251119-0001",  // Auto-generated
  patientId: patient.id,
  appointmentId: appointment.id,
  billableType: "appointment",
  totalAmount: consultationFee + hospitalFee,
  paidAmount: 0-600 (based on status),
  dueAmount: calculated,
  status: "PENDING" | "PARTIAL" | "PAID"
}
```

### **2. Bill Items (Line Items)**

Each bill includes 2 items:

1. **Consultation Fee** - Doctor's consultation charge
2. **Hospital Fee** - Hospital service charge

```typescript
billItems: [
  {
    itemName: "Consultation Fee",
    itemableType: "consultation",
    quantity: 1,
    unitPrice: 500-1500 (varies by doctor),
    total: unitPrice
  },
  {
    itemName: "Hospital Fee",
    itemableType: "service",
    quantity: 1,
    unitPrice: 100-200,
    total: unitPrice
  }
]
```

### **3. Payment Records**

For paid/partially paid bills, payment records are created:

```typescript
{
  billId: bill.id,
  amount: paidAmount,
  paymentMethod: "CASH" | "BKASH" | "NAGAD" | etc. (random),
  receivedBy: employeeId,
  status: "success",
  paymentDate: appointmentDate
}
```

### **4. Appointment Events**

Payment events are logged for audit trail:

```typescript
{
  appointmentId: appointment.id,
  eventType: "PAYMENT_RECEIVED" | "PAYMENT_PARTIAL",
  performedBy: employeeId,
  description: "Payment of ৳500 received via CASH",
  metadata: {
    paymentAmount: 500,
    paymentMethod: "CASH",
    billId: "bill-id"
  }
}
```

---

## 📊 Bill Status Distribution

Based on appointment status:

### **COMPLETED Appointments:**

- 70% → **PAID** (fully paid)
- 20% → **PARTIAL** (50% paid)
- 10% → **PENDING** (unpaid)

### **IN_CONSULTATION Appointments:**

- 50% → **PARTIAL** (50% paid)
- 50% → **PENDING** (unpaid)

### **WAITING Appointments:**

- 100% → **PENDING** (unpaid)

---

## 🔢 Sample Data Generated

For each doctor (3 doctors):

- **3-5 appointments** created
- **Total: ~9-15 appointments**

Each appointment gets:

- ✅ 1 Bill
- ✅ 2 Bill Items (consultation + hospital fee)
- ✅ 0-1 Payment record (if paid/partial)
- ✅ 0-1 Appointment event (if payment made)

**Total Records Created:**

- ~12 Appointments
- ~12 Bills
- ~24 Bill Items
- ~8-10 Payment Records
- ~8-10 Appointment Events

---

## 💰 Bill Number Format

```
BILL-YYYYMMDD-XXXX
```

Example: `BILL-20251119-0001`

- **YYYYMMDD** - Billing date
- **XXXX** - Sequential number (padded to 4 digits)

---

## 🧪 Testing the Invoice Modal

Now you can test the invoice modal with real data:

1. **Go to Appointments page**
2. **Click "Invoice" on any appointment**
3. **You'll see:**
   - ✅ Bill information (patient, doctor, date)
   - ✅ Bill items (consultation + hospital fee)
   - ✅ Total, paid, and due amounts
   - ✅ Payment history (if any payments made)
   - ✅ Payment form (if due amount > 0)

### **Test Scenarios:**

**Scenario 1: Fully Paid Bill**

- Status: PAID
- Due Amount: ৳0
- Shows: Payment history + Print button

**Scenario 2: Partially Paid Bill**

- Status: PARTIAL
- Due Amount: > ৳0
- Shows: Payment history + Payment form

**Scenario 3: Unpaid Bill**

- Status: PENDING
- Due Amount: Full amount
- Shows: Payment form only

---

## 🔐 Payment Methods Available

The seed creates 7 payment methods:

1. CASH
2. BKASH
3. NAGAD
4. ROCKET
5. UPAY
6. CARD
7. BANK_TRANSFER

All are active and available in the payment form dropdown.

---

## 📝 Code Changes

**File Modified:** `prisma/seed.ts`

**Lines Added:** ~100 lines

**Key Changes:**

1. Changed `appointments.create()` to store result in `appointment` variable
2. Added bill creation logic after each appointment
3. Added bill items creation (consultation + hospital fee)
4. Added conditional payment record creation
5. Added appointment event logging for payments
6. Added console log for bill creation confirmation

---

## ✅ Verification

Run this query to verify bills were created:

```sql
SELECT
  a.id as appointment_id,
  a.serialNumber,
  b.billNumber,
  b.totalAmount,
  b.paidAmount,
  b.dueAmount,
  b.status
FROM appointments a
LEFT JOIN bills b ON b.appointmentId = a.id
ORDER BY a.serialNumber;
```

**Expected Result:** Every appointment should have a linked bill.

---

## 🎯 Next Steps

The invoice modal is now fully functional with:

- ✅ Real bill data
- ✅ Bill items display
- ✅ Payment history
- ✅ Payment form for due amounts
- ✅ Type-safe implementation
- ✅ Secure payment flow

**Ready for production testing!** 🚀

---

## 📋 Summary

| Feature                        | Status   |
| ------------------------------ | -------- |
| Bills created for appointments | ✅ Done  |
| Bill items (line items)        | ✅ Done  |
| Payment records                | ✅ Done  |
| Appointment events             | ✅ Done  |
| Bill status distribution       | ✅ Done  |
| Payment methods                | ✅ Done  |
| Invoice modal integration      | ✅ Ready |

**All appointments now have complete billing information!**
