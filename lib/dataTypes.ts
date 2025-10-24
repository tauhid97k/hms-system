// Pagination Link Interface
interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Meta Data Interface
interface Meta {
  links: PaginationLink[];
  current_page: number;
  last_page: number;
  total: number;
}

// Paginated Data and Meta Type
export type PaginatedData<TData> = {
  data: TData[];
  meta: Meta;
};

// User
export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};
