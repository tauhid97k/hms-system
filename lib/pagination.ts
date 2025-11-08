import type { PaginationSchemaType } from "@/schema/paginationSchema";

// Extract pagination queries
export function getPaginationQuery(query: PaginationSchemaType) {
  const take = Math.max(1, query.limit ?? 10);
  const page = Math.max(1, query.page ?? 1);
  const skip = (page - 1) * take;

  return { skip, take, page, limit: take };
}
