import { InferType, object, string } from "yup";

export const userSchema = object({
  name: string().required(),
  username: string().required(),
  email: string().email().required(),
  password: string().required(),
  role: string().required(),
});
export type UserSchemaType = InferType<typeof userSchema>;
