import { client } from "@/lib/orpc";
import { SpecializationsTable } from "./specializations-table";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SpecializationsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const search = searchParams.search ? String(searchParams.search) : undefined;
  const isActive = searchParams.isActive
    ? String(searchParams.isActive)
    : "all";

  const specializations = await client.specializations.getAll({
    page,
    limit,
    search,
    isActive,
  });

  return <SpecializationsTable initialData={specializations} />;
}
