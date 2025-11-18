import { number, object, string } from "yup";

// Create Appointment Schema
export const createAppointmentSchema = object({
  patientId: string().required("Patient is required"),
  doctorId: string().required("Doctor is required"),
  assignedBy: string().required("Assigned by is required"),
  appointmentType: string()
    .oneOf(["NEW", "FOLLOWUP"], "Invalid appointment type")
    .required("Appointment type is required"),
  chiefComplaint: string().nullable().default(null),
});

// Create Appointment with New Patient Schema
export const createAppointmentWithNewPatientSchema = object({
  // Patient fields (simplified for quick appointment)
  patientName: string().required("Patient name is required"),
  patientPhone: string().required("Phone number is required"),
  patientAge: number()
    .required("Age is required")
    .positive("Age must be positive")
    .integer("Age must be a whole number"),
  patientGender: string()
    .oneOf(["MALE", "FEMALE", "OTHER"], "Invalid gender")
    .required("Gender is required"),
  // Appointment fields
  doctorId: string().required("Doctor is required"),
  assignedBy: string().required("Assigned by is required"),
  appointmentType: string()
    .oneOf(["NEW", "FOLLOWUP"], "Invalid appointment type")
    .required("Appointment type is required"),
  chiefComplaint: string().nullable().default(null),
});

// Update Appointment Schema
export const updateAppointmentSchema = object({
  id: string().required("Appointment ID is required"),
  chiefComplaint: string().optional().nullable(),
  diagnosis: string().optional().nullable(),
  status: string()
    .oneOf(
      ["WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"],
      "Invalid status",
    )
    .optional(),
});

// Update Appointment Status Schema (Quick status update)
export const updateAppointmentStatusSchema = object({
  id: string().required("Appointment ID is required"),
  status: string()
    .oneOf(
      ["WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"],
      "Invalid status",
    )
    .required("Status is required"),
  performedBy: string().required("Performed by is required"),
});

// Call Next Patient Schema
export const callNextPatientSchema = object({
  doctorId: string().required("Doctor ID is required"),
  performedBy: string().required("Performed by is required"),
});
