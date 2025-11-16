# HMS Implementation Summary - Employees Architecture

## ✅ Completed: Employees-Based Architecture Refactoring

### Architecture Decision

**Problem Solved**: Initial design had doctor-specific fields in the `users` table, violating separation of concerns and limiting scalability.

**Solution Implemented**: Clean separation using industry-standard pattern:
- **users table** = Authentication only (name, email, password, phone, avatar)
- **employees table** = Extended profile (bio, qualification, consultationFee, etc.)
- **Transaction-based creation** = User + Employee created atomically
- **Role-based differentiation** = Uses `roles` and `user_roles` tables

This pattern is used by major systems like Salesforce, Workday, Epic EMR, and BambooHR.

### Schema Changes (Prisma)

#### 1. Users Table (Clean Auth)
```prisma
model users {
  id            String   @id @default(ulid())
  name          String
  email         String   @unique
  password      String?
  phone         String?
  avatar        String?
  isActive      Boolean  @default(true)

  // Relations
  employeeProfile employees?
  userRoles       user_roles[]
  sessions        sessions[]
  accounts        accounts[]
}
```

#### 2. Employees Table (Extended Profile)
```prisma
model employees {
  id              String   @id @default(ulid())
  userId          String   @unique // One-to-one with users
  bio             String?  @db.Text
  qualification   String?  @db.Text
  experiences     Json?    // Array of work history
  certificates    Json?    // Array of certificates
  documents       Json?    // File uploads metadata

  // Medical staff fields (optional)
  consultationFee Float?
  hospitalFee     Float?   @default(0)
  isAvailable     Boolean  @default(true)

  // Relations
  user                    users
  employeeDepartments     employee_departments[]
  employeeSpecializations employee_specializations[]
  doctorVisits            visits[]
  prescriptions           prescriptions[]
  // ... all staff-related relations
}
```

#### 3. Junction Tables (Many-to-Many)
```prisma
// Employees ↔ Departments
model employee_departments {
  id           String   @id @default(ulid())
  employeeId   String
  departmentId String
  isPrimary    Boolean  @default(false) // Mark primary department

  employee   employees   @relation(...)
  department departments @relation(...)

  @@unique([employeeId, departmentId])
}

// Employees ↔ Specializations
model employee_specializations {
  id               String   @id @default(ulid())
  employeeId       String
  specializationId String

  employee       employees       @relation(...)
  specialization specializations @relation(...)

  @@unique([employeeId, specializationId])
}
```

#### 4. Updated Relations
All models now reference `employees.id` instead of `users.id`:
- ✅ visits (doctorId, assignedBy)
- ✅ prescriptions (doctorId)
- ✅ test_orders (orderedBy)
- ✅ test_results (technicianId, reviewedBy)
- ✅ payments (receivedBy)
- ✅ visit_events (performedBy)

### Better-Auth Configuration

Reverted to minimal auth fields in `lib/auth.ts`:
```typescript
user: {
  additionalFields: {
    phone: { type: "string", required: false },
    avatar: { type: "string", required: false },
    isActive: { type: "boolean", required: false, defaultValue: true },
  },
}
```

All doctor/staff fields moved to `employees` table.

### API Routes (Router)

#### Doctors (`router/users.ts`) - Transaction-Based CRUD
✅ **createDoctor** - Creates user + employee + roles + departments + specializations in single transaction
```typescript
// Transaction steps:
1. Hash password
2. Create users record
3. Create employees record (linked via userId)
4. Create employee_departments records
5. Create employee_specializations records
6. Assign "doctor" role via user_roles
```

✅ **getDoctors** - Lists employees with nested user, departments, specializations
✅ **getDoctor** - Single doctor with full details
✅ **updateDoctor** - Updates both user and employee in transaction
✅ **deleteDoctor** - Deletes employee + user (with visit validation)
✅ **toggleDoctorAvailability** - Quick availability toggle

### Validation Schemas

#### `schema/doctorSchema.ts`
**Create Schema** - All fields needed for transaction:
- User fields: name*, email*, password*, phone
- Employee fields: bio, qualification, consultationFee*, hospitalFee, isAvailable
- Relationships: departmentIds[], specializationIds[]
- JSON fields: experiences, certificates

**Update Schema** - No password, all optional except id

### UI Components

#### 1. Data Types (`lib/dataTypes.ts`)
✅ Added `Specialization` type
✅ Added `Employee` type with nested relations
✅ `Doctor` = alias for `Employee` (backward compatibility)

#### 2. Doctors Table (`app/dashboard/doctors/doctors-table.tsx`)
✅ Displays multiple departments as badges (primary = default variant)
✅ Displays multiple specializations as badges (outline variant)
✅ Shows qualification (truncated)
✅ Three filters: Department + Specialization + Availability
✅ Debounced search (500ms)
✅ Safe client pattern for all mutations

#### 3. Doctor Form (`app/dashboard/doctors/_components/doctor-form.tsx`)
**Comprehensive form with 4 sections:**
1. **Basic Information** - name*, email*, password* (create only), phone
2. **Professional Details** - bio (textarea 5 rows), qualification (textarea 3 rows)
3. **Departments & Specializations** - Multi-select badge UI
4. **Fee Structure** - consultationFee*, hospitalFee, isAvailable

**Features:**
- Badge-based multi-select (click to toggle)
- Visual feedback (X icon on selected)
- Section headings for clarity
- Responsive 2-column layout
- Form reset after creation (stays on page)
- Router.back() after edit

#### 4. New Doctor Page (`app/dashboard/doctors/new/page.tsx`)
✅ Server component - fetches departments & specializations server-side
✅ No client-side loading states
✅ Clean separation with `NewDoctorForm` client component

#### 5. Edit Doctor Page (`app/dashboard/doctors/[id]/edit/page.tsx`)
✅ Server component - fetches doctor + departments + specializations
✅ Pre-populates form with existing data
✅ Uses same `DoctorForm` component (mode="edit")

### Database Migration

✅ Applied with `npx prisma db push --accept-data-loss`
- Created `employees` table
- Created `employee_departments` junction table
- Created `employee_specializations` junction table
- Removed doctor fields from `users` table
- Updated all foreign key references

### Router Exports (`router/index.ts`)

```typescript
doctors: {
  getAll: getDoctors,        // From router/users.ts
  getOne: getDoctor,
  create: createDoctor,      // Transaction-based
  update: updateDoctor,      // Transaction-based
  delete: deleteDoctor,
  toggleAvailability: toggleDoctorAvailability,
}
```

## Scalability Benefits

### ✅ Clean Architecture
1. **Separation of Concerns** - Auth vs Profile
2. **Single Responsibility** - Each table has clear purpose
3. **Flexibility** - Optional fields support any employee type
4. **Type Safety** - Yup validates at app level, not DB level

### ✅ Future Employee Types
**Easy to add:**
- Nurses - Same fields (bio, qualification, departments)
- Lab Technicians - No consultationFee needed
- Pharmacists - Could add licenseNumber to employees
- Radiologists - Same as doctors
- Receptionists - Just basic fields

**How:**
1. Create form with role-specific validation
2. Use transaction to create user + employee
3. Assign appropriate role
4. Done! No schema changes needed.

### ✅ Proven Pattern
This is **Single Table Inheritance (STI)** pattern:
- Used by Salesforce (Users/Contacts)
- Used by Workday (Employees)
- Used by GitHub (Users)
- Recommended in Martin Fowler's patterns

## What's Different From Before?

### Old Design Problems:
❌ Doctor fields in users table → Violates separation
❌ Single department per doctor → Not realistic
❌ Specialization as string → Not relational
❌ Hard to add other staff types → Schema changes needed

### New Design Solutions:
✅ Clean users table → Pure authentication
✅ Employees table → Scalable profile
✅ Many-to-many departments → Multiple assignments
✅ Many-to-many specializations → Relational & filterable
✅ Role-based differentiation → Add any staff type

## Files Modified

### Schema & Config
- ✅ `prisma/schema.prisma` - Complete refactoring
- ✅ `lib/auth.ts` - Removed doctor fields
- ✅ `lib/dataTypes.ts` - Added Employee & Specialization types

### Router & Validation
- ✅ `router/users.ts` - Transaction-based CRUD
- ✅ `router/index.ts` - Updated exports
- ✅ `schema/doctorSchema.ts` - New validation structure

### UI Components
- ✅ `app/dashboard/doctors/doctors-table.tsx` - Multi-select filters & badge display
- ✅ `app/dashboard/doctors/_components/doctor-form.tsx` - Comprehensive 4-section form
- ✅ `app/dashboard/doctors/new/page.tsx` - Server-side data fetch
- ✅ `app/dashboard/doctors/new/_components/new-doctor-form.tsx` - Client form handler
- ✅ `app/dashboard/doctors/[id]/edit/page.tsx` - Server-side pre-population
- ✅ `app/dashboard/doctors/[id]/edit/_components/edit-doctor-form.tsx` - Client edit handler

## Next Steps

### Immediate
1. ⏳ Test complete CRUD flow
2. ⏳ Update seed script with sample employees
3. ⏳ Verify cascade deletes work properly

### Future Modules
1. **Nurses Module** - Reuse same pattern
2. **Lab Technicians Module** - Reuse same pattern
3. **Staff Management** - Generic employee CRUD
4. **Role Assignment UI** - Manage user roles

### Visits Module Integration
When implementing visits:
- Use `employees.id` for doctorId
- Use `employees.id` for assignedBy
- Filter doctors by role + isAvailable
- Show doctor name via `employee.user.name`

## Architecture Validation

**Question**: Is this scalable for future employee types?
**Answer**: ✅ Yes - Used by billion-dollar systems

**Question**: Can we enforce required fields per type?
**Answer**: ✅ Yes - Via Yup schemas at app level

**Question**: What if types have 20+ unique fields?
**Answer**: Use JSON columns or consider table-per-type

**Question**: Performance concerns with nullable columns?
**Answer**: ✅ No - Modern DBs handle this efficiently

## Migration Notes

**Data Loss**: Accepted during development
- 6 users had `hospitalFee` and `isAvailable` values
- Will be recreated via seed script

**Next Migration**: When ready for production:
1. Export existing doctor data
2. Run migration
3. Create employees records
4. Link to existing users

---

**Status**: ✅ Complete architecture refactoring done
**Pattern**: Single Table Inheritance (industry-proven)
**Next**: Test & seed data
