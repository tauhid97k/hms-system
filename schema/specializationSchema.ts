import { boolean, object, string } from "yup";

export const createSpecializationSchema = object({
  name: string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  code: string()
    .required("Code is required")
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must not exceed 10 characters")
    .matches(
      /^[A-Z0-9_]+$/,
      "Code must be uppercase letters, numbers, or underscores only",
    ),
  description: string().optional().default(""),
  isActive: boolean().optional().default(true),
});

export const updateSpecializationSchema = object({
  name: string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  code: string()
    .required("Code is required")
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must not exceed 10 characters")
    .matches(
      /^[A-Z0-9_]+$/,
      "Code must be uppercase letters, numbers, or underscores only",
    ),
  description: string().optional().default(""),
  isActive: boolean().required(),
});
