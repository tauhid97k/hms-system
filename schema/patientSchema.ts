import { object, string, number, boolean, mixed } from "yup";

// Enums matching Prisma schema
export const genderEnum = ["MALE", "FEMALE", "OTHER"] as const;
export const bloodGroupEnum = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
] as const;

export const createPatientSchema = object({
  name: string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  age: number()
    .required("Age is required")
    .min(1, "Age must be at least 1")
    .max(150, "Age must be at most 150")
    .integer("Age must be a whole number"),
  phone: string()
    .required("Phone number is required")
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im, "Invalid phone number format"),
  gender: mixed<(typeof genderEnum)[number]>()
    .oneOf(genderEnum, "Invalid gender")
    .optional()
    .nullable(),
  bloodGroup: mixed<(typeof bloodGroupEnum)[number]>()
    .oneOf(bloodGroupEnum, "Invalid blood group")
    .optional()
    .nullable(),
  email: string()
    .email("Invalid email format")
    .optional()
    .nullable(),
  address: string().optional().nullable(),
  notes: string().optional().nullable(),
  isActive: boolean().optional().default(true),
});

export const updatePatientSchema = object({
  name: string()
    .min(2, "Name must be at least 2 characters")
    .optional(),
  age: number()
    .min(1, "Age must be at least 1")
    .max(150, "Age must be at most 150")
    .integer("Age must be a whole number")
    .optional(),
  phone: string()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im, "Invalid phone number format")
    .optional(),
  gender: mixed<(typeof genderEnum)[number]>()
    .oneOf(genderEnum, "Invalid gender")
    .optional()
    .nullable(),
  bloodGroup: mixed<(typeof bloodGroupEnum)[number]>()
    .oneOf(bloodGroupEnum, "Invalid blood group")
    .optional()
    .nullable(),
  email: string()
    .email("Invalid email format")
    .optional()
    .nullable(),
  address: string().optional().nullable(),
  notes: string().optional().nullable(),
  isActive: boolean().optional(),
});

export type CreatePatientSchemaType = typeof createPatientSchema.__outputType;
export type UpdatePatientSchemaType = typeof updatePatientSchema.__outputType;
