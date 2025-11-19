import { object, string } from "yup";

export const labSchema = object({
  name: string().required("Lab name is required"),
  code: string().required("Lab code is required"),
  departmentId: string().nullable(),
  description: string().nullable(),
});

export type LabSchemaType = {
  name: string;
  code: string;
  departmentId?: string | null;
  description?: string | null;
};
