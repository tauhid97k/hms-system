import { client } from "@/lib/orpc";
import { TestsTable } from "./tests-table";

const TestsPage = async ({ searchParams }: PageProps<"/dashboard/tests">) => {
  const { page, limit, search, labId, isActive } = await searchParams;

  const [tests, labs] = await Promise.all([
    client.tests.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search ? String(search) : "",
      isActive: isActive ? String(isActive) : "all",
      labId: labId ? String(labId) : undefined,
    }),
    client.labs.getAll(),
  ]);

  return <TestsTable tests={tests} labs={labs} />;
};

export default TestsPage;
