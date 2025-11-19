import { client } from "@/lib/orpc";
import MedicinesTable from "./medicines-table";

const MedicinesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}) => {
  const { page, limit, search } = await searchParams;

  const medicines = await client.medicines.getAll({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    search: search || undefined,
  });

  return <MedicinesTable medicines={medicines} />;
};

export default MedicinesPage;
