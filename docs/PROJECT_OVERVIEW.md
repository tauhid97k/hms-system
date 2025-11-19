# 🏥 Hospital Management System - Project Overview

**Last Updated:** November 20, 2025  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Key Features](#key-features)
5. [Database Schema](#database-schema)
6. [API Structure](#api-structure)
7. [Authentication & Authorization](#authentication--authorization)
8. [Audit Trail System](#audit-trail-system)
9. [Development Setup](#development-setup)
10. [Project Structure](#project-structure)

---

## 🎯 Project Description

A comprehensive Hospital Management System built with Next.js 16, featuring:

- Patient management
- Appointment scheduling
- Queue management
- Prescription management
- Billing & payments
- Test orders & results
- Medicine inventory
- Audit trail logging

---

## 🛠️ Tech Stack

### **Frontend:**

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library
- **Forms:** React Hook Form + Yup validation
- **State Management:** React Query (TanStack Query)
- **Icons:** Lucide React

### **Backend:**

- **API:** oRPC (Type-safe RPC framework)
- **Database:** PostgreSQL
- **ORM:** Prisma 6.19
- **Authentication:** NextAuth.js
- **Session:** Database sessions

### **Development:**

- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode

---

## 🏗️ Architecture

### **Application Structure:**

```
HMS (Next.js App)
├── Frontend (React Components)
│   ├── Pages (App Router)
│   ├── Components (Reusable UI)
│   └── Client Components (Interactive)
│
├── Backend (oRPC Routers)
│   ├── Protected Routes (Auth required)
│   ├── Public Routes (No auth)
│   └── Context Middleware (Session handling)
│
└── Database (PostgreSQL + Prisma)
    ├── Schema (Data models)
    ├── Migrations (Version control)
    └── Seed Data (Initial data)
```

### **Data Flow:**

```
User → UI Component → oRPC Client → Router → Prisma → PostgreSQL
                                      ↓
                                  Middleware
                                  (Auth, Validation)
```

---

## ✨ Key Features

### **1. Patient Management**

- ✅ Patient registration with unique ID generation
- ✅ Patient search and filtering
- ✅ Medical history tracking
- ✅ Contact information management

### **2. Appointment System**

- ✅ Appointment scheduling
- ✅ Serial number & queue position management
- ✅ Appointment status tracking (WAITING, IN_CONSULTATION, COMPLETED, CANCELLED)
- ✅ Doctor-wise appointment views
- ✅ Real-time queue updates

### **3. Queue Management**

- ✅ Real-time queue display
- ✅ Call next patient functionality
- ✅ Queue position tracking
- ✅ Doctor-specific queues

### **4. Prescription Management**

- ✅ Digital prescription creation
- ✅ Medicine selection with instructions
- ✅ Prescription history per patient
- ✅ One prescription per appointment rule

### **5. Billing & Payments**

- ✅ Automated bill generation
- ✅ Multiple payment methods (Cash, bKash, Nagad, Rocket, Upay, Card, Bank Transfer)
- ✅ Partial payment support
- ✅ Payment history tracking
- ✅ Invoice modal with payment confirmation
- ✅ Bill status management (PENDING, PARTIAL, PAID)

### **6. Test Management**

- ✅ Test order creation
- ✅ Test result entry
- ✅ Test status tracking
- ✅ Lab-wise test organization

### **7. Medicine Inventory**

- ✅ Medicine catalog
- ✅ Stock management
- ✅ Medicine instructions library
- ✅ Pricing information

### **8. Audit Trail**

- ✅ Simplified audit logging with `initiatedBy`
- ✅ Automatic timestamp tracking
- ✅ User action tracking
- ✅ Change history

---

## 🗄️ Database Schema

### **Core Tables:**

#### **Users & Authentication:**

- `users` - User accounts
- `sessions` - Active sessions
- `verification_tokens` - Email verification

#### **Organization:**

- `departments` - Hospital departments
- `specializations` - Doctor specializations
- `roles` - User roles
- `employees` - Staff information

#### **Patient Care:**

- `patients` - Patient records
- `appointments` - Appointment bookings
- `appointment_events` - Appointment history
- `prescriptions` - Digital prescriptions
- `prescription_medicines` - Prescribed medicines

#### **Billing:**

- `bills` - Bill records
- `bill_items` - Bill line items
- `payments` - Payment transactions
- `payment_methods` - Available payment methods

#### **Tests:**

- `tests` - Test catalog
- `test_orders` - Test orders
- `test_results` - Test results
- `labs` - Laboratory information

#### **Inventory:**

- `medicines` - Medicine catalog
- `medicine_instructions` - Usage instructions
- `categories` - Medicine categories

### **Audit Pattern:**

All tables include:

```prisma
initiatedBy String   // User who created/updated
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```

---

## 🔌 API Structure

### **Router Organization:**

```
router/
├── appointments.ts    # Appointment CRUD & queue
├── patients.ts        # Patient management
├── bills.ts           # Billing operations
├── payments.ts        # Payment processing
├── paymentMethods.ts  # Payment methods
├── prescriptions.ts   # Prescription management
├── tests.ts           # Test catalog
├── medicines.ts       # Medicine inventory
├── doctors.ts         # Doctor management
├── departments.ts     # Department management
├── specializations.ts # Specialization management
├── context.ts         # Middleware & context
└── index.ts           # Router exports
```

### **API Patterns:**

**List Endpoints:**

```typescript
GET /patients?page=1&limit=20
Response: {
  data: Patient[],
  meta: { page: 1, limit: 20, total: 100 }
}
```

**Single Resource:**

```typescript
GET /patients/:id
Response: Patient
```

**Create:**

```typescript
POST /patients
Body: { name, age, phone, ... }
Response: Patient
```

**Update:**

```typescript
PATCH /patients/:id
Body: { name, age, ... }
Response: Patient
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow:**

1. User logs in with credentials
2. NextAuth.js validates credentials
3. Session created in database
4. Session cookie sent to client
5. Subsequent requests include session cookie
6. Middleware validates session

### **Authorization Levels:**

- **Public Routes:** No authentication required
- **Protected Routes:** Requires valid session
- **Role-Based:** Admin, Doctor, Receptionist, etc.

### **Context Middleware:**

```typescript
// Automatic session injection
export const protectedOS = authedOS.use(async ({ context, next }) => {
  if (!context.user?.id) {
    throw new Error("Unauthorized");
  }
  return next({ context: { user: context.user } });
});
```

---

## 📝 Audit Trail System

### **Simplified Pattern:**

- **Single Field:** `initiatedBy` (who created/updated)
- **Automatic Timestamps:** `createdAt`, `updatedAt`
- **No Redundancy:** Removed `receivedBy`, `updatedBy`, `performedBy`, etc.

### **Special Cases:**

- **Test Results:** `initiatedBy` + `reviewedBy` (different people)
- **Payments:** `initiatedBy` only (who created payment record)

### **Benefits:**

- ✅ Simpler to understand
- ✅ Easier to maintain
- ✅ Consistent across all tables
- ✅ Clear audit trail

---

## 🚀 Development Setup

### **Prerequisites:**

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### **Installation:**

```bash
# Clone repository
git clone <repository-url>
cd hms-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

### **Environment Variables:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hms"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📁 Project Structure

```
hms-system/
├── app/                      # Next.js App Router
│   ├── (main)/              # Public pages
│   │   └── auth/            # Authentication pages
│   ├── dashboard/           # Protected dashboard
│   │   ├── appointments/    # Appointment management
│   │   ├── patients/        # Patient management
│   │   ├── queue/           # Queue management
│   │   ├── prescriptions/   # Prescription management
│   │   ├── tests/           # Test management
│   │   └── ...              # Other modules
│   └── api/                 # API routes
│
├── components/              # Reusable components
│   └── ui/                  # UI components
│
├── lib/                     # Utilities & helpers
│   ├── auth.ts              # Authentication
│   ├── dataTypes.ts         # Type definitions
│   ├── orpc.ts              # oRPC client
│   └── prisma.ts            # Prisma client
│
├── prisma/                  # Database
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seed data
│   └── migrations/          # Migration files
│
├── router/                  # oRPC routers
│   ├── appointments.ts      # Appointment routes
│   ├── patients.ts          # Patient routes
│   ├── context.ts           # Middleware
│   └── index.ts             # Router exports
│
├── schema/                  # Validation schemas
│   ├── appointmentSchema.ts
│   ├── patientSchema.ts
│   └── ...
│
└── docs/                    # Documentation
    ├── RULES.md             # Development rules
    ├── PLANS.md             # Implementation plans
    └── PROJECT_OVERVIEW.md  # This file
```

---

## 🎯 Key Design Decisions

### **1. oRPC over tRPC:**

- Type-safe API calls
- Better error handling
- Simpler setup
- Built-in middleware support

### **2. Database Sessions:**

- More secure than JWT
- Better session management
- Easy to revoke
- Audit trail support

### **3. Simplified Audit Trail:**

- Single `initiatedBy` field
- Automatic timestamps
- No redundant fields
- Clear ownership

### **4. Centralized Types:**

- All shared types in `lib/dataTypes.ts`
- Better code reuse
- Consistent typing
- Easier maintenance

### **5. Context Middleware:**

- Automatic session handling
- Type-safe context
- No repeated auth code
- Cleaner routers

---

## 📊 Current Status

### **✅ Completed Features:**

- ✅ Patient management
- ✅ Appointment scheduling
- ✅ Queue management
- ✅ Prescription management
- ✅ Billing & payments
- ✅ Invoice modal
- ✅ Test management
- ✅ Medicine inventory
- ✅ Audit trail
- ✅ Authentication
- ✅ Authorization

### **🚧 In Progress:**

- Print invoice functionality
- Payment receipt generation
- Advanced reporting
- Analytics dashboard

### **📋 Planned:**

- Mobile app
- SMS notifications
- Email notifications
- Backup & restore
- Multi-language support

---

## 📚 Additional Resources

- **Development Rules:** See `docs/RULES.md`
- **Implementation Plans:** See `docs/PLANS.md`
- **API Documentation:** Generated from oRPC routers
- **Database Schema:** See `prisma/schema.prisma`

---

## 🤝 Contributing

1. Follow the development rules in `docs/RULES.md`
2. Write tests for new features
3. Update documentation
4. Submit pull request

---

## 📄 License

[Your License Here]

---

**For questions or support, contact the development team.**
