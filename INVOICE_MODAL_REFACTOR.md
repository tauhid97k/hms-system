# Invoice Modal Refactored to Use React Hook Form

**Date:** November 19, 2025  
**Status:** ✅ Completed

---

## 🎯 Problem Identified

The invoice modal was using a **hacky, workaround approach** instead of following the established pattern used throughout the application:

### **Before (Wrong Way):**

- ❌ Manual `useState` for payment method
- ❌ Manual form handling with `onClick`
- ❌ No validation
- ❌ Inconsistent with other modals (categories, etc.)
- ❌ No proper form state management

```typescript
// ❌ Wrong approach
const [paymentMethod, setPaymentMethod] = useState("CASH");
const [isSubmitting, setIsSubmitting] = useState(false);

const handleConfirmPayment = async () => {
  setIsSubmitting(true);
  // Manual API call
  setIsSubmitting(false);
};

<Select value={paymentMethod} onValueChange={setPaymentMethod}>
<Button onClick={handleConfirmPayment} isLoading={isSubmitting}>
```

---

## ✅ Solution: Follow the Pattern

Refactored to match the **Categories modal pattern** and other modals in the application.

### **After (Correct Way):**

#### **1. Added React Hook Form Setup** ✅

```typescript
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { object, string } from "yup";

// Payment schema
const paymentSchema = object({
  paymentMethod: string().required("Payment method is required"),
});

type PaymentFormData = {
  paymentMethod: string;
};
```

#### **2. Initialize Form with defaultValues** ✅

```typescript
const paymentForm = useForm<PaymentFormData>({
  resolver: yupResolver(paymentSchema),
  defaultValues: {
    paymentMethod: "CASH",  // ✅ Default value in form config
  },
});
```

**Benefits:**

- Default value properly set in form configuration
- Form state managed by react-hook-form
- Validation handled automatically

#### **3. Proper Form Submission Handler** ✅

```typescript
const onSubmitPayment = async (data: PaymentFormData) => {
  if (!billData) return;

  const { error } = await safeClient.payments.create({
    billId: billData.id,
    amount: billData.dueAmount,
    paymentMethod: data.paymentMethod,  // ✅ From form data
    receivedBy: currentEmployeeId,
  });

  if (error) {
    toast.error(error.message || "Failed to process payment");
  } else {
    toast.success("Payment confirmed successfully!");
    handleClose();
    router.refresh();
  }
};
```

#### **4. Form Reset on Close** ✅

```typescript
const handleClose = () => {
  setBillData(null);
  paymentForm.reset();  // ✅ Reset form state
  onOpenChange(false);
};
```

#### **5. Proper Form JSX with Controller** ✅

```tsx
<form
  onSubmit={paymentForm.handleSubmit(onSubmitPayment)}
  className="space-y-4"
>
  <FieldSet disabled={paymentForm.formState.isSubmitting}>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Confirm Payment</h3>
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Amount to Pay:
          </span>
          <span className="text-lg font-bold">
            ৳{billData.dueAmount.toFixed(2)}
          </span>
        </div>
        <FieldGroup>
          <Controller
            name="paymentMethod"
            control={paymentForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="paymentMethod">
                  Payment Method <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </div>

    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={handleClose}>
        Close
      </Button>
      <Button
        type="submit"
        isLoading={paymentForm.formState.isSubmitting}
      >
        <LuCheck />
        <span>Confirm Payment</span>
      </Button>
    </div>
  </FieldSet>
</form>
```

---

## 📋 Key Improvements

### **1. Consistent with Application Pattern** ✅

- Matches categories modal structure
- Matches other CRUD modals
- Follows established conventions

### **2. Proper Form Management** ✅

- `useForm` hook for state management
- `Controller` for controlled components
- `FieldSet` for form grouping and disabled state
- `FieldGroup` for field organization
- `FieldError` for validation errors

### **3. Validation** ✅

- Yup schema validation
- Required field validation
- Error display with `FieldError`

### **4. Loading States** ✅

- `paymentForm.formState.isSubmitting` for button loading
- `FieldSet disabled` for entire form during submission
- No manual state management needed

### **5. Default Values** ✅

- Set in `defaultValues` config
- Properly initialized on mount
- Reset on form close

---

## 🔄 Before vs After Comparison

| Aspect             | Before (Wrong)        | After (Correct)          |
| ------------------ | --------------------- | ------------------------ |
| **Form State**     | Manual `useState`     | `useForm` hook           |
| **Validation**     | None                  | Yup schema               |
| **Default Value**  | Manual state init     | `defaultValues` config   |
| **Submission**     | Manual `onClick`      | Form `onSubmit`          |
| **Loading State**  | Manual `isSubmitting` | `formState.isSubmitting` |
| **Error Handling** | Manual                | `FieldError` component   |
| **Form Reset**     | Manual state reset    | `form.reset()`           |
| **Disabled State** | Manual per-field      | `FieldSet disabled`      |
| **Pattern**        | Custom/Hacky          | Consistent with app      |

---

## 🎯 Benefits of Refactoring

### **1. Maintainability** ✅

- Consistent pattern across all modals
- Easy to understand and modify
- Follows React best practices

### **2. Type Safety** ✅

- Proper TypeScript types
- Form data type checking
- No manual type assertions needed

### **3. Validation** ✅

- Automatic validation on submit
- Error messages displayed properly
- Required field enforcement

### **4. User Experience** ✅

- CASH pre-selected by default
- Proper loading states
- Form disabled during submission
- Clear error messages

### **5. Code Quality** ✅

- Less boilerplate
- No manual state management
- Cleaner, more readable code

---

## 📝 Files Modified

**File:** `app/dashboard/appointments/_components/invoice-modal.tsx`

**Changes:**

1. Added react-hook-form imports
2. Created payment schema with Yup
3. Replaced `useState` with `useForm`
4. Refactored form JSX to use `Controller`
5. Added `FieldSet`, `FieldGroup`, `FieldError`
6. Changed button to `type="submit"`
7. Used `formState.isSubmitting` for loading

**Lines Changed:** ~80 lines refactored

---

## ✅ Result

The invoice modal now:

- ✅ Follows the same pattern as categories modal
- ✅ Uses react-hook-form properly
- ✅ Has proper validation
- ✅ Shows CASH as default
- ✅ Handles loading states correctly
- ✅ Is consistent with the rest of the application
- ✅ Is maintainable and scalable

**No more hacky workarounds!** The modal now follows best practices and matches the established patterns in the codebase. 🎉

---

## 🔍 Pattern Reference

For future modals, always follow this pattern:

1. **Create schema** with Yup
2. **Initialize form** with `useForm` + `defaultValues`
3. **Wrap in `<form>`** with `onSubmit={form.handleSubmit(handler)}`
4. **Use `<FieldSet>`** with `disabled={form.formState.isSubmitting}`
5. **Use `<Controller>`** for controlled components
6. **Use `<FieldError>`** for validation errors
7. **Button** should be `type="submit"` with `isLoading={form.formState.isSubmitting}`
8. **Reset form** on close with `form.reset()`

This is the **correct way** to handle forms in this application!
