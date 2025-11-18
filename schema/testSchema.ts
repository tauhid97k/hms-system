import { boolean, number, object, string } from "yup";

// Create/Update Test Schema
export const testSchema = object({
  name: string().required("Test name is required"),
  code: string().required("Test code is required"),
  description: string().nullable().optional(),
  price: number()
    .required("Price is required")
    .min(0, "Price must be positive"),
  labId: string().nullable().optional(),
  isActive: boolean().default(true),
});

export type TestSchemaType = ReturnType<typeof testSchema.validateSync>;
