import { client } from "@/lib/orpc";
import LabsTable from "./labs-table";

const LabsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}) => {
  const { page, limit, search } = await searchParams;

  const [labs, departments] = await Promise.all([
    client.labs.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || undefined,
    }),
    client.departments.getAll({
      page: 1,
      limit: 100,
      isActive: "true",
    }),
  ]);

  return <LabsTable labs={labs} departments={departments.data} />;
};

export default LabsPage;
