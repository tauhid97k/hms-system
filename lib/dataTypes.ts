import type { Prisma } from "../prisma/generated/client";

// Meta Data
export type MetaData = {
  page: number;
  limit: number;
  total: number;
};

// Paginated Data
export type PaginatedData<TData> = {
  data: TData[];
  meta: MetaData;
};

// Category
export type Category = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Department
export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Patient
export type Patient = {
  id: string;
  patientId: string;
  name: string;
  age: number;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  bloodGroup:
    | "A_POSITIVE"
    | "A_NEGATIVE"
    | "B_POSITIVE"
    | "B_NEGATIVE"
    | "AB_POSITIVE"
    | "AB_NEGATIVE"
    | "O_POSITIVE"
    | "O_NEGATIVE"
    | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Specialization
export type Specialization = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    employeeSpecializations: number;
  };
};

// Employee (Doctor, Nurse, Technician, etc.)
export type Employee = {
  id: string;
  userId: string;
  departmentId: string | null;
  bio: string | null;
  qualification: string | null;
  experiences: Prisma.JsonValue | null; // JSON
  certificates: Prisma.JsonValue | null; // JSON
  documents: Prisma.JsonValue | null; // JSON
  consultationFee: number | null;
  hospitalFee: number | null;
  isAvailable: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  employeeSpecializations?: Array<{
    id: string;
    employeeId: string;
    specializationId: string;
    specialization: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  _count?: {
    doctorAppointments: number;
  };
};

// Doctor (alias for Employee for backward compatibility)
export type Doctor = Employee;

// Bill
export type Bill = {
  id: string;
  billNumber: string;
  patientId: string;
  appointmentId: string | null;
  billableType: string | null;
  billableId: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | "CANCELLED";
  billingDate: string | Date;
  dueDate: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  patient?: {
    id: string;
    patientId: string;
    name: string;
    phone: string;
  };
  appointment?: {
    id: string;
    serialNumber: number;
    appointmentType: string;
    doctor: {
      id: string;
      user: {
        name: string;
      } | null;
    };
  } | null;
  billItems?: Array<{
    id: string;
    itemableType: string;
    itemableId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    notes: string | null;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string | Date;
    transactionId: string | null;
  }>;
};

// Medicine
export type Medicine = {
  id: string;
  name: string;
  genericName: string | null;
  type: string | null;
  manufacturer: string | null;
  strength: string | null;
  price: number | null;
  stock: number | null;
  minStock: number | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Medicine Instruction
export type MedicineInstruction = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

// Prescription Item
export type PrescriptionItem = {
  id: string;
  prescriptionId: string;
  medicineId: string;
  instructionId: string | null;
  duration: string | null;
  notes: string | null;
  medicine?: Medicine;
  instruction?: MedicineInstruction | null;
};

// Prescription
export type Prescription = {
  id: string;
  appointmentId: string;
  doctorId: string;
  notes: string | null;
  followUpDate: string | Date | null;
  createdAt: string | Date;
  items?: PrescriptionItem[];
  doctor?: Employee;
};

// Appointment data for prescription dialog
export type AppointmentForPrescription = {
  id: string;
  appointmentDate: string | Date;
  appointmentType: "NEW" | "FOLLOWUP";
  serialNumber: number;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    patientId: string;
  };
  doctor: {
    id: string;
    user?: {
      id?: string;
      name: string;
      email?: string;
      avatar?: string | null;
    } | null;
  };
};

// Appointment table row (for appointments list view)
export type AppointmentTableRow = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  appointmentType: "NEW" | "FOLLOWUP";
  appointmentDate: Date;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    phone: string;
  };
  doctor: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
    } | null;
    department?: {
      id: string;
      name: string;
    } | null;
  };
};

// Queue appointment for real-time streaming
export type QueueAppointment = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  appointmentType: "NEW" | "FOLLOWUP";
  chiefComplaint: string | null;
  appointmentDate: Date;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    phone: string;
  };
  doctor: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  initiatedByUser: {
    id: string;
    user: {
      name: string;
    };
  };
};

// Lab (simple version for dropdowns)
export type Lab = {
  id: string;
  name: string;
  code: string;
};

// Lab (full version with all fields)
export type LabFull = Lab & {
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Test Type
export type TestType = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  labId: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Test Type with Lab relation (for table views)
export type TestTableRow = TestType & {
  lab?: {
    id: string;
    name: string;
  } | null;
};
