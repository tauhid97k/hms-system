# 📋 Development Rules & Best Practices

**Last Updated:** November 20, 2025

---

## 🎯 Core Development Rules (1-6)

These rules must be followed for all code changes to maintain consistency and quality.

---

### ✅ **Rule #1: Prescription Duplicate Prevention**

**Problem:** Multiple prescriptions can be created for the same appointment

**Rule:**

- ✅ One prescription per appointment
- ✅ Check for existing prescription before creating new one
- ✅ Show error if prescription already exists
- ✅ Provide "Edit Prescription" option instead

**Implementation:**

```typescript
// Before creating prescription
const existing = await prisma.prescriptions.findFirst({
  where: { appointmentId }
});

if (existing) {
  throw new Error("Prescription already exists for this appointment");
}
```

---

### ✅ **Rule #2: Router Pagination Pattern**

**Problem:** Inconsistent pagination patterns across routers

**Rule:**

- ✅ List endpoints return `PaginatedData<T>`
- ✅ Single resource endpoints return `T`
- ✅ Use consistent pagination parameters: `page`, `limit`
- ✅ Include metadata: `total`, `page`, `limit`

**Implementation:**

```typescript
// ✅ CORRECT: List endpoint
export const getPatients = os
  .handler(async ({ input }) => {
    const patients = await prisma.patients.findMany({
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });

    const total = await prisma.patients.count();

    return {
      data: patients,
      meta: { page: input.page, limit: input.limit, total },
    };
  });

// ✅ CORRECT: Single resource endpoint
export const getPatient = os
  .handler(async ({ input }) => {
    const patient = await prisma.patients.findUnique({
      where: { id: input.id },
    });
    return patient; // Returns single object
  });
```

---

### ✅ **Rule #3: Input Validation**

**Problem:** Missing or inconsistent validation

**Rule:**

- ✅ Validate on frontend (react-hook-form + yup)
- ✅ Validate on backend (yup schemas)
- ✅ Add business logic validation
- ✅ Return clear error messages

**Implementation:**

```typescript
// ✅ Frontend validation
const schema = object({
  name: string().required("Name is required"),
  age: number().required("Age is required").positive().integer(),
});

const form = useForm({
  resolver: yupResolver(schema),
});

// ✅ Backend validation
export const createPatient = os
  .input(schema)
  .handler(async ({ input }) => {
    // Additional business logic validation
    if (input.age < 0 || input.age > 150) {
      throw new Error("Invalid age");
    }

    const patient = await prisma.patients.create({ data: input });
    return patient;
  });
```

---

### ✅ **Rule #4: Type Definitions Centralized**

**Problem:** Types scattered across components

**Rule:**

- ✅ All shared types in `lib/dataTypes.ts`
- ✅ Component-specific types in component file
- ✅ Import from centralized location
- ✅ Use Prisma-generated types when possible

**Implementation:**

```typescript
// ✅ CORRECT: lib/dataTypes.ts
export type Patient = {
  id: string;
  name: string;
  age: number;
  // ... other fields
};

export type PaginatedData<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

// ✅ CORRECT: Component imports
import type { Patient, PaginatedData } from "@/lib/dataTypes";

// ❌ WRONG: Inline type definitions
type Patient = { ... }; // Don't do this for shared types
```

---

### ✅ **Rule #5: Modal/Dialog Pattern**

**Problem:** Inconsistent modal rendering patterns

**Rule:**

- ✅ Always render modal component (don't conditionally mount)
- ✅ Control visibility with `open` prop
- ✅ Use `onOpenChange` callback
- ✅ Manage state externally
- ✅ Clean up state on close

**Implementation:**

```typescript
// ✅ CORRECT Pattern
export function MyModal({ open, onOpenChange }) {
  const [data, setData] = useState(null);

  const handleClose = () => {
    setData(null); // Clean up
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {data ? <Content /> : <Loading />}
      </DialogContent>
    </Dialog>
  );
}

// ✅ Usage
const [modalOpen, setModalOpen] = useState(false);

return (
  <>
    <Button onClick={() => setModalOpen(true)}>Open</Button>
    <MyModal open={modalOpen} onOpenChange={setModalOpen} />
  </>
);

// ❌ WRONG: Conditional rendering
{modalOpen && <MyModal />} // Don't do this
```

---

### ✅ **Rule #6: Safe Client Usage**

**Problem:** Inconsistent error handling in client components

**Rule:**

- ✅ Use `createSafeClient(client)` in client components
- ✅ Use regular `client` in server components
- ✅ Handle errors consistently
- ✅ Use `safeClient` for ALL calls (queries + mutations)

**Implementation:**

```typescript
// ✅ CORRECT: Client component
"use client";

import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";

const safeClient = createSafeClient(client);

export function MyComponent() {
  const handleSubmit = async (data) => {
    // ✅ Use safeClient for queries
    const { data: user, error: userError } =
      await safeClient.users.getOne({ id: data.userId });

    if (userError) {
      toast.error(userError.message);
      return;
    }

    // ✅ Use safeClient for mutations
    const { error: createError } =
      await safeClient.patients.create(data);

    if (createError) {
      toast.error(createError.message);
    } else {
      toast.success("Created successfully!");
    }
  };
}

// ✅ CORRECT: Server component
export default async function Page() {
  // ✅ Use regular client
  const patients = await client.patients.getAll({ page: 1, limit: 20 });
  return <Table data={patients} />;
}
```

---

## 🎯 Additional Best Practices

### **Audit Trail Pattern**

**Rule:** Use single `initiatedBy` field for audit tracking

```prisma
model example_table {
  id          String   @id @default(ulid())
  initiatedBy String   // Who created/updated this record
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  initiatedByUser users @relation("InitiatedExamples", fields: [initiatedBy], references: [id])
}
```

**Special Cases:**

- `payments`: Keep `initiatedBy` (who created record)
- `test_results`: Use `initiatedBy` + `reviewedBy` (different people)

---

### **Context Middleware Pattern**

**Rule:** Use context middleware for session handling

```typescript
// router/context.ts
export const protectedOS = authedOS.use(async ({ context, next }) => {
  if (!context.user?.id) {
    throw new Error("Unauthorized");
  }
  return next({ context: { user: context.user } });
});

// Usage in routers
export const createPatient = protectedOS
  .handler(async ({ input, context }) => {
    const patient = await prisma.patients.create({
      data: {
        ...input,
        initiatedBy: context.user.id, // ✅ From context
      },
    });
    return patient;
  });
```

---

### **Error Handling Pattern**

**Rule:** Consistent error handling across the app

```typescript
// ✅ Frontend
try {
  const { error } = await safeClient.action();
  if (error) {
    toast.error(error.message || "Operation failed");
  } else {
    toast.success("Success!");
  }
} catch (error) {
  console.error("Unexpected error:", error);
  toast.error("An unexpected error occurred");
}

// ✅ Backend
export const action = protectedOS
  .handler(async ({ input }) => {
    // Validation errors
    if (!input.required) {
      throw new Error("Required field missing");
    }

    // Business logic errors
    const existing = await prisma.model.findFirst({ where: {...} });
    if (existing) {
      throw new Error("Already exists");
    }

    // Database operations
    const result = await prisma.model.create({ data: input });
    return result;
  });
```

---

## 📊 Compliance Checklist

Before submitting code, verify:

- [ ] ✅ Types centralized in `lib/dataTypes.ts`
- [ ] ✅ Validation on frontend and backend
- [ ] ✅ Using `safeClient` in client components
- [ ] ✅ Modal pattern follows rules
- [ ] ✅ Pagination pattern consistent
- [ ] ✅ Error handling consistent
- [ ] ✅ Audit trail uses `initiatedBy`
- [ ] ✅ Context middleware for protected routes
- [ ] ✅ No TypeScript errors
- [ ] ✅ Code follows existing patterns

---

## 🚀 Quick Reference

| Scenario         | Pattern            | Example                        |
| ---------------- | ------------------ | ------------------------------ |
| List endpoint    | `PaginatedData<T>` | `getPatients()`                |
| Single resource  | `T`                | `getPatient(id)`               |
| Client component | `safeClient`       | `safeClient.patients.create()` |
| Server component | `client`           | `client.patients.getAll()`     |
| Modal            | Always render      | `<Dialog open={open}>`         |
| Validation       | Frontend + Backend | `yup` schemas                  |
| Audit            | `initiatedBy`      | From `context.user.id`         |
| Types            | Centralized        | `lib/dataTypes.ts`             |

---

**Remember:** These rules exist to maintain consistency, quality, and maintainability. Follow them strictly! 🎯
