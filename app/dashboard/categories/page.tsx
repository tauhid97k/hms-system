import { client } from "@/lib/orpc";
import CategoriesTable from "./categories-table";

const CategoriesPage = async ({
  searchParams,
}: PageProps<"/dashboard/categories">) => {
  const { page, limit } = await searchParams;

  const categories = await client.categories.get({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return <CategoriesTable categories={categories} />;
};

export default CategoriesPage;
