import { array, date, object, string } from "yup";

// Prescription Item Schema
export const prescriptionItemSchema = object({
  medicineId: string().required("Medicine is required"),
  instructionId: string().nullable().optional(),
  duration: string().nullable().optional(),
  notes: string().nullable().optional(),
});

// Create Prescription Schema
export const createPrescriptionSchema = object({
  appointmentId: string().required("Appointment is required"),
  doctorId: string().required("Doctor is required"),
  notes: string().nullable().optional(),
  followUpDate: date().nullable().optional(),
  items: array(prescriptionItemSchema)
    .min(1, "At least one medicine is required")
    .required("Medicines are required"),
});
