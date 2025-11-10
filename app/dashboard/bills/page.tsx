import { client } from "@/lib/orpc";
import { BillsTable } from "./_components/bills-table";

export const dynamic = "force-dynamic";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const status = params.status as "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | "CANCELLED" | "DUE" | undefined;
  const patientId = params.patientId as string | undefined;
  const search = params.search as string | undefined;

  const billsData = await client.bills.getAll({
    page,
    limit,
    status,
    patientId,
    search,
  });

  return <BillsTable initialData={billsData} />;
}
