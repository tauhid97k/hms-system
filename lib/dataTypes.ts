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
