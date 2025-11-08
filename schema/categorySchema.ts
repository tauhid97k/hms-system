import { InferType, object, string } from "yup";

export const categorySchema = object({
  title: string().required(),
  description: string().required(),
});
export type CategorySchemaType = InferType<typeof categorySchema>;
