// Meta Data
export type MetaData = {
  page: number;
  limit: number;
  total: number;
};

// Paginated Data
export type PaginatedData<TData> = {
  data: TData[];
  meta: MetaData;
};

// Category
export type Category = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Department
export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Patient
export type Patient = {
  id: string;
  patientId: string;
  name: string;
  age: number;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  bloodGroup:
    | "A_POSITIVE"
    | "A_NEGATIVE"
    | "B_POSITIVE"
    | "B_NEGATIVE"
    | "AB_POSITIVE"
    | "AB_NEGATIVE"
    | "O_POSITIVE"
    | "O_NEGATIVE"
    | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};
