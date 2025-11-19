import { number, object, string } from "yup";

export const medicineSchema = object({
  name: string().required("Medicine name is required"),
  genericName: string().nullable(),
  type: string().nullable(),
  manufacturer: string().nullable(),
  strength: string().nullable(),
  price: number().nullable().positive("Price must be positive"),
  stock: number()
    .nullable()
    .integer("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  minStock: number()
    .nullable()
    .integer("Min stock must be an integer")
    .min(0, "Min stock cannot be negative"),
});

export type MedicineSchemaType = {
  name: string;
  genericName?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  price?: number | null;
  stock?: number | null;
  minStock?: number | null;
};
