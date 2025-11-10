import { client } from "@/lib/orpc";
import { DoctorsTable } from "./doctors-table";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DoctorsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;
  const search = searchParams.search ? String(searchParams.search) : undefined;
  const departmentId = searchParams.departmentId ? String(searchParams.departmentId) : "all";
  const specializationId = searchParams.specializationId ? String(searchParams.specializationId) : "all";
  const isAvailable = searchParams.isAvailable ? String(searchParams.isAvailable) : "all";

  // Fetch doctors, departments, and specializations
  const [doctors, departments, specializations] = await Promise.all([
    client.doctors.getAll({
      page,
      limit,
      search,
      departmentId,
      specializationId,
      isAvailable,
    }),
    client.departments.getAll({ page: 1, limit: 100, isActive: "true" }),
    client.specializations.getAll({ page: 1, limit: 100, isActive: "true" }),
  ]);

  return (
    <DoctorsTable
      initialData={doctors}
      departments={departments.data}
      specializations={specializations.data}
    />
  );
}
