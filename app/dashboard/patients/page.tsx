import { client } from "@/lib/orpc";
import { PatientsTable } from "./patients-table";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function PatientsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const search = searchParams.search ? String(searchParams.search) : undefined;
  const gender = searchParams.gender ? String(searchParams.gender) : "all";
  const bloodGroup = searchParams.bloodGroup
    ? String(searchParams.bloodGroup)
    : "all";
  const isActive = searchParams.isActive
    ? String(searchParams.isActive)
    : "all";

  const patients = await client.patients.getAll({
    page,
    limit,
    search,
    gender,
    bloodGroup,
    isActive,
  });

  return <PatientsTable initialData={patients} />;
}
