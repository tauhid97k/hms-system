import { array, boolean, mixed, number, object, string } from "yup";

// Create Doctor Schema (User + Employee creation in transaction)
export const createDoctorSchema = object({
  // User fields
  name: string().required("Name is required"),
  email: string().email("Invalid email").required("Email is required"),
  password: string().required("Password is required").min(8, "Password must be at least 8 characters"),
  phone: string().optional().nullable(),

  // Employee fields
  bio: string().optional().nullable(),
  qualification: string().optional().nullable(),
  consultationFee: number()
    .required("Consultation fee is required")
    .min(0, "Consultation fee must be at least 0")
    .typeError("Consultation fee must be a number"),
  hospitalFee: number()
    .optional()
    .min(0, "Hospital fee must be at least 0")
    .typeError("Hospital fee must be a number")
    .default(0),
  isAvailable: boolean().optional().default(true),

  // Relationships
  departmentIds: array(string()).optional().default([]),
  specializationIds: array(string()).optional().default([]),

  // JSON fields (optional)
  experiences: mixed().optional().nullable(),
  certificates: mixed().optional().nullable(),
});

// Update Doctor Schema (Update both user and employee)
export const updateDoctorSchema = object({
  id: string().required("Doctor ID is required"),

  // User fields (optional for update)
  name: string().optional(),
  email: string().email("Invalid email").optional(),
  phone: string().optional().nullable(),

  // Employee fields (optional for update)
  bio: string().optional().nullable(),
  qualification: string().optional().nullable(),
  consultationFee: number()
    .optional()
    .min(0, "Consultation fee must be at least 0")
    .typeError("Consultation fee must be a number"),
  hospitalFee: number()
    .optional()
    .min(0, "Hospital fee must be at least 0")
    .typeError("Hospital fee must be a number"),
  isAvailable: boolean().optional(),

  // Relationships (optional for update)
  departmentIds: array(string()).optional(),
  specializationIds: array(string()).optional(),

  // JSON fields (optional for update)
  experiences: mixed().optional().nullable(),
  certificates: mixed().optional().nullable(),
});
