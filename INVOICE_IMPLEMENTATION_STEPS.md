# Invoice Modal Implementation - Step by Step

## ✅ Completed Steps

### 1. Schema Changes

- ✅ Removed `PaymentMethod` enum (too rigid)
- ✅ Created `payment_methods` table (flexible, data-driven)
- ✅ Updated `payments.paymentMethod` to use `String` instead of enum
- ✅ Added Bangladesh payment methods to seed data:
  - Cash
  - bKash
  - Nagad
  - Rocket
  - Upay
  - Card
  - Bank Transfer

### 2. Backend Routes Created

- ✅ `router/paymentMethods.ts` - Get all active payment methods
- ✅ `router/payments.ts` - Create payment & get bill with payments
- ✅ Exported in `router/index.ts`:
  - `paymentMethods.getAll()`
  - `payments.create()`
  - `bills.getWithPayments()`

### 3. Payment Creation Logic

```typescript
// Transaction ensures atomicity:
1. Create payment record
2. Update bill (paidAmount, dueAmount, status)
3. Log appointment event (PAYMENT_RECEIVED or PAYMENT_PARTIAL)
```

---

## 🚀 Next Steps (To Do)

### Step 1: Run Database Migration

**IMPORTANT: Stop dev server first to unlock Prisma files!**

```bash
# Stop dev server (Ctrl+C)

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_payment_methods_table

# Run seed to add payment methods
npx prisma db seed
```

### Step 2: Create Invoice Modal Component

File: `app/dashboard/appointments/_components/invoice-modal.tsx`

**Features:**

- Show bill details (number, total, paid, due, status)
- Show patient & appointment info
- Show bill items breakdown
- Show payment history list
- Payment method dropdown (from API)
- Amount input (default: dueAmount)
- Confirm Payment button
- Smart button logic (Confirm Payment vs Print Invoice)

### Step 3: Update Appointments Table

File: `app/dashboard/appointments/_components/appointments-table.tsx`

**Changes:**

- Replace "Print Receipt" with "Invoice"
- Use invoice icon (LuFileText or LuReceipt)
- Open InvoiceModal on click
- Pass appointment ID to modal

### Step 4: Test Flow

1. Create appointment → Bill auto-created (PENDING)
2. Click "Invoice" → Modal opens
3. Select payment method → Enter amount
4. Click "Confirm Payment" → Payment created
5. Bill status updates → PAID
6. Appointment event logged
7. Modal shows payment history

---

## 📋 Invoice Modal Structure

```typescript
type InvoiceModalProps = {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Fetch data:
- Bill with payments (bills.getWithPayments)
- Payment methods (paymentMethods.getAll)

// Submit payment:
- payments.create({
    billId,
    amount,
    paymentMethod,
    receivedBy: currentEmployeeId,
  })
```

---

## 🎨 UI Layout

```
┌───────────────────────────────────────────────┐
│  Invoice #BILL-2025-000123                    │
│  ───────────────────────────────────────────  │
│                                               │
│  📋 Bill Information                          │
│  Patient: John Doe (PID25-000001)            │
│  Doctor: Dr. Smith                            │
│  Date: Jan 19, 2025                           │
│  Serial: #45  Queue: 12                       │
│  Status: COMPLETED ✅                         │
│                                               │
│  💰 Bill Details                              │
│  ───────────────────────────────────────────  │
│  Consultation Fee              ৳500.00        │
│  Hospital Fee                  ৳100.00        │
│  ───────────────────────────────────────────  │
│  Total                         ৳600.00        │
│  Paid                          ৳0.00          │
│  Due                           ৳600.00        │
│                                               │
│  Bill Status: PENDING 🟡                      │
│                                               │
│  💳 Payment History                           │
│  (No payments yet)                            │
│                                               │
│  ───────────────────────────────────────────  │
│                                               │
│  💵 Make Payment                              │
│  Payment Method: [Cash ▼]                     │
│  Amount: [600.00]                             │
│                                               │
│  [Close]  [Confirm Payment] ✅                │
└───────────────────────────────────────────────┘
```

### After Payment:

```
│  💳 Payment History                           │
│  • Jan 19, 2025 10:30 AM - ৳600.00 (Cash)    │
│    Received by: John Admin                    │
│                                               │
│  Bill Status: PAID ✅                         │
│                                               │
│  [Close]  [Print Invoice] 🖨️                 │
```

---

## 🔧 Technical Details

### Payment Method Dropdown

```typescript
const { data: paymentMethods } = useQuery({
  queryKey: ["paymentMethods"],
  queryFn: () => client.paymentMethods.getAll(),
});

<Select>
  {paymentMethods?.map((method) => (
    <SelectItem key={method.id} value={method.name}>
      {method.name}
    </SelectItem>
  ))}
</Select>
```

### Payment Submission

```typescript
const handleConfirmPayment = async () => {
  const { data, error } = await safeClient.payments.create({
    billId: bill.id,
    amount: paymentAmount,
    paymentMethod: selectedMethod,
    receivedBy: currentEmployeeId,
  });

  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Payment confirmed successfully!");
    // Refresh bill data
    refetch();
  }
};
```

### Smart Button Logic

```typescript
const isPaid = bill.status === "PAID";
const hasDue = bill.dueAmount > 0;

{isPaid ? (
  <Button onClick={handlePrint}>
    <LuPrinter /> Print Invoice
  </Button>
) : (
  <Button onClick={handleConfirmPayment}>
    <LuCheck /> Confirm Payment
  </Button>
)}
```

---

## 📊 Database Flow

```
Appointment Created
    ↓
Bill Created (PENDING)
    ├─ totalAmount: ৳600
    ├─ paidAmount: ৳0
    └─ dueAmount: ৳600
    ↓
User Clicks "Invoice"
    ↓
Modal Opens (shows bill + payment form)
    ↓
User Selects Payment Method & Amount
    ↓
Clicks "Confirm Payment"
    ↓
Transaction Begins:
    ├─ 1. Create payment record
    ├─ 2. Update bill:
    │     ├─ paidAmount: ৳600
    │     ├─ dueAmount: ৳0
    │     └─ status: PAID
    └─ 3. Log appointment event
    ↓
Transaction Committed
    ↓
Modal Refreshes (shows payment history)
```

---

## 🎯 Key Features

1. **Flexible Payment Methods**: Can add/remove without code changes
2. **Partial Payments**: Supports multiple payments for one bill
3. **Audit Trail**: Every payment is logged with timestamp & employee
4. **Transaction Safety**: Atomic updates prevent data inconsistency
5. **Real-time Updates**: Modal refreshes after payment
6. **Print Ready**: Can print invoice after payment

---

## 🔒 Security Considerations

- ✅ Payment amount validated (cannot exceed due amount)
- ✅ Bill existence checked before payment
- ✅ Transaction ensures atomicity
- ✅ Employee ID tracked for accountability
- ✅ Payment status logged in appointment events

---

## 📝 Testing Checklist

- [ ] Create appointment → Bill auto-created
- [ ] Open invoice modal → Shows correct bill details
- [ ] Payment methods loaded from database
- [ ] Enter payment → Amount validated
- [ ] Confirm payment → Transaction succeeds
- [ ] Bill status updates → PAID
- [ ] Payment history shows → Correct details
- [ ] Appointment event logged → PAYMENT_RECEIVED
- [ ] Try overpayment → Error shown
- [ ] Try partial payment → Status = PARTIAL
- [ ] Second payment → Completes bill → Status = PAID

---

## 🚨 Important Notes

1. **Stop dev server before running Prisma commands** (file lock issue)
2. **Payment methods are now data, not code** (can be managed via admin panel later)
3. **Bill status auto-updates** based on paid/due amounts
4. **Appointment events track all payments** for audit trail
5. **Modal should refresh after payment** to show updated status

---

## 📚 Files Modified/Created

### Modified:

- `prisma/schema.prisma` - Removed enum, added payment_methods table
- `prisma/seed.ts` - Added payment methods seed data
- `router/index.ts` - Exported new routes

### Created:

- `router/paymentMethods.ts` - Get payment methods
- `router/payments.ts` - Create payment, get bill with payments
- `INVOICE_IMPLEMENTATION_STEPS.md` - This file

### To Create:

- `app/dashboard/appointments/_components/invoice-modal.tsx`
- Update `app/dashboard/appointments/_components/appointments-table.tsx`

---

**Ready to implement the Invoice Modal component!** 🚀
