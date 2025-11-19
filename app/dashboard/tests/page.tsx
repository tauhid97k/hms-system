import { client } from "@/lib/orpc";
import { TestsTable } from "./tests-table";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const TestsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const limit = params.limit ? Number(params.limit) : 10;
  const search = params.search ? String(params.search) : "";
  const isActive = params.isActive ? String(params.isActive) as "true" | "false" | "all" : "all";
  const labId = params.labId ? String(params.labId) : undefined;

  const [tests, labs] = await Promise.all([
    client.tests.getAll({ page, limit, search, isActive, labId }),
    client.labs.getAll({ page: 1, limit: 100 }),
  ]);

  return <TestsTable tests={tests} labs={labs.data} />;
};

export default TestsPage;
