# Select vs AdvancedSelect Components

**Date:** November 16, 2024  
**Purpose:** Distinguish between regular Select and searchable AdvancedSelect

---

## 📦 **Component Overview**

### **1. Select (`components/ui/select.tsx`)** - Regular Radix UI Select

- ✅ Standard dropdown without search
- ✅ Best for: Short lists (< 10 items), simple selections
- ✅ Examples: Gender, Blood Group, Status filters, Pagination row count
- ✅ Uses Radix UI Select primitives

### **2. AdvancedSelect (`components/ui/advanced-select.tsx`)** - Searchable Select

- ✅ Dropdown WITH search functionality
- ✅ Best for: Long lists (departments, doctors, patients, etc.)
- ✅ Examples: Department selection, Doctor selection
- ✅ Uses Command + Popover for search

---

## 🎯 **When to Use Which?**

### **Use Regular `Select`:**

```tsx
// ✅ Short, fixed lists
<Select value={gender} onValueChange={setGender}>
  <SelectTrigger>
    <SelectValue placeholder="Select gender" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="MALE">Male</SelectItem>
    <SelectItem value="FEMALE">Female</SelectItem>
    <SelectItem value="OTHER">Other</SelectItem>
  </SelectContent>
</Select>

// ✅ Pagination
<Select value={limit} onValueChange={setLimit}>
  <SelectTrigger>
    <SelectValue placeholder="Items per page" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="10">10 Items</SelectItem>
    <SelectItem value="25">25 Items</SelectItem>
    <SelectItem value="50">50 Items</SelectItem>
  </SelectContent>
</Select>
```

### **Use `AdvancedSelect`:**

```tsx
// ✅ Long, searchable lists
import { AdvancedSelect, AdvancedSelectOption } from "@/components/ui/advanced-select";

const departmentOptions: AdvancedSelectOption[] = departments.map((dept) => ({
  value: dept.id,
  label: dept.name,
}));

<AdvancedSelect
  options={departmentOptions}
  value={selectedDepartment}
  onChange={setSelectedDepartment}
  placeholder="Select department..."
/>
```

---

## 📋 **API Comparison**

### **Regular Select (Radix UI Pattern):**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### **AdvancedSelect (Simple API):**

```tsx
import { AdvancedSelect, AdvancedSelectOption } from "@/components/ui/advanced-select";

const options: AdvancedSelectOption[] = [
  { value: "1", label: "Option 1" },
  { value: "2", label: "Option 2" },
];

<AdvancedSelect
  options={options}
  value={value}
  onChange={setValue}
  placeholder="Select..."
  disabled={false}
  emptyMessage="No options found."
/>
```

---

## 📁 **Current Usage**

### **Files Using Regular `Select`:**

1. ✅ `components/ui/pagination.tsx` - Row count selector
2. ✅ `app/dashboard/patients/_components/patient-form.tsx` - Gender, Blood Group
3. ✅ `app/dashboard/patients/create-patient-dialog.tsx` - Gender, Blood Group
4. ✅ `app/dashboard/patients/edit-patient-dialog.tsx` - Gender, Blood Group
5. ✅ `app/dashboard/patients/patients-table.tsx` - Filters
6. ✅ `app/dashboard/appointments/_components/appointment-form.tsx` - Doctor selection
7. ✅ `app/dashboard/appointments/_components/appointments-table.tsx` - Filters
8. ✅ `app/dashboard/queue/_components/queue-table.tsx` - Filters
9. ✅ `app/dashboard/doctors/doctors-table.tsx` - Filters
10. ✅ `app/dashboard/departments/departments-table.tsx` - Filters
11. ✅ `app/dashboard/specializations/specializations-table.tsx` - Filters
12. ✅ `app/dashboard/bills/_components/bills-table.tsx` - Filters

### **Files Using `AdvancedSelect`:**

1. ✅ `app/dashboard/doctors/_components/doctor-form.tsx` - Department selection

---

## 🔄 **Migration Guide**

### **From Regular Select to AdvancedSelect:**

**Before:**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={departmentId} onValueChange={setDepartmentId}>
  <SelectTrigger>
    <SelectValue placeholder="Select department" />
  </SelectTrigger>
  <SelectContent>
    {departments.map((dept) => (
      <SelectItem key={dept.id} value={dept.id}>
        {dept.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**After:**

```tsx
import { AdvancedSelect, AdvancedSelectOption } from "@/components/ui/advanced-select";

const departmentOptions: AdvancedSelectOption[] = departments.map((dept) => ({
  value: dept.id,
  label: dept.name,
}));

<AdvancedSelect
  options={departmentOptions}
  value={departmentId}
  onChange={setDepartmentId}
  placeholder="Select department..."
/>
```

---

## ✅ **Benefits of This Approach**

### **Regular Select:**

- ✅ Lightweight for simple use cases
- ✅ Native Radix UI behavior
- ✅ No unnecessary search for short lists
- ✅ Familiar API for existing code

### **AdvancedSelect:**

- ✅ Search functionality for long lists
- ✅ Better UX for finding items
- ✅ Cleaner, simpler API
- ✅ Consistent search experience

---

## 🎨 **Visual Differences**

### **Regular Select:**

```
┌─────────────────────┐
│ Select gender    ▼  │
└─────────────────────┘
        ↓ Click
┌─────────────────────┐
│ Male                │
│ Female              │
│ Other               │
└─────────────────────┘
```

### **AdvancedSelect:**

```
┌─────────────────────┐
│ Select department ▼ │
└─────────────────────┘
        ↓ Click
┌─────────────────────┐
│ 🔍 Search...        │
├─────────────────────┤
│ ✓ Cardiology        │
│   Neurology         │
│   Orthopedics       │
│   Pediatrics        │
│   ... (scrollable)  │
└─────────────────────┘
```

---

## 📝 **Best Practices**

### **Choose Regular Select When:**

- ✅ List has < 10 items
- ✅ Items are well-known (Gender, Status, etc.)
- ✅ No need for search
- ✅ Space-constrained UI (pagination, filters)

### **Choose AdvancedSelect When:**

- ✅ List has > 10 items
- ✅ Items are dynamic (departments, doctors, patients)
- ✅ Users need to search
- ✅ Better UX is important

---

## 🚀 **Summary**

- ✅ **`select.tsx`** = Regular Radix UI Select (no search)
- ✅ **`advanced-select.tsx`** = Searchable Select with Command
- ✅ Use the right tool for the right job
- ✅ Both components coexist peacefully
- ✅ No breaking changes to existing code

**All components properly organized!** 🎉
