import { InferType, object, string } from "yup";

// Sign Up Schema
export const signUpSchema = object({
  name: string().required("Name is required"),
  email: string().email("Invalid email").required("Email is required"),
  organizationName: string().required("Organization name is required"),
  password: string().required("Password is required"),
});
export type SignUpSchemaType = InferType<typeof signUpSchema>;

// Sign In Schema
export const signInSchema = object({
  email: string().email("Invalid email").required("Email is required"),
  password: string().required("Password is required"),
});
export type SignInSchemaType = InferType<typeof signInSchema>;
