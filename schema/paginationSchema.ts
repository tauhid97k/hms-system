import { InferType, number, object } from "yup";

export const paginationSchema = object({
  page: number().integer().min(1).default(1),
  limit: number().integer().min(10).max(100).default(10),
});

export type PaginationSchemaType = InferType<typeof paginationSchema>;
