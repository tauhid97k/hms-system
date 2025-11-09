import { boolean, object, string } from "yup"

export const createDepartmentSchema = object({
  name: string()
    .required("Department name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  code: string()
    .required("Department code is required")
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must not exceed 20 characters")
    .matches(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, or underscores only"),
  description: string().nullable().max(500, "Description must not exceed 500 characters"),
  isActive: boolean().default(true),
})

export const updateDepartmentSchema = object({
  name: string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  code: string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must not exceed 20 characters")
    .matches(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, or underscores only")
    .optional(),
  description: string().nullable().max(500, "Description must not exceed 500 characters").optional(),
  isActive: boolean().optional(),
})
