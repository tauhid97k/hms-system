import { object, string } from "yup";

// Create Visit Schema
export const createVisitSchema = object({
  patientId: string().required("Patient is required"),
  doctorId: string().required("Doctor is required"),
  assignedBy: string().required("Assigned by is required"),
  visitType: string()
    .oneOf(["NEW", "FOLLOWUP"], "Invalid visit type")
    .required("Visit type is required"),
  chiefComplaint: string().optional().nullable(),
});

// Update Visit Schema
export const updateVisitSchema = object({
  id: string().required("Visit ID is required"),
  chiefComplaint: string().optional().nullable(),
  diagnosis: string().optional().nullable(),
  status: string()
    .oneOf(
      ["WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"],
      "Invalid status",
    )
    .optional(),
});

// Update Visit Status Schema (Quick status update)
export const updateVisitStatusSchema = object({
  id: string().required("Visit ID is required"),
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
