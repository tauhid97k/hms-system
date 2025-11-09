import Spinner from "@/components/ui/spinner";
import { client } from "@/lib/orpc";
import { Suspense } from "react";
import { DepartmentsTable } from "./departments-table";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DepartmentsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const search = searchParams.search ? String(searchParams.search) : undefined;
  const isActive = searchParams.isActive
    ? String(searchParams.isActive)
    : "all";

  const departments = await client.departments.getAll({
    page,
    limit,
    search,
    isActive,
  });

  return (
    <Suspense fallback={<Spinner />}>
      <DepartmentsTable initialData={departments} />
    </Suspense>
  );
}
