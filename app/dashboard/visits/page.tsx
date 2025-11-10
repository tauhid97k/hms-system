import { client } from "@/lib/orpc";
import { VisitsTable } from "./_components/visits-table";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function VisitsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 20;
  const status = searchParams.status ? String(searchParams.status) : undefined;

  // Default to today's date if no date filter
  const visitDate = searchParams.visitDate
    ? String(searchParams.visitDate)
    : format(new Date(), "yyyy-MM-dd");

  // Fetch visits
  const visitsData = await client.visits.getAll({
    page,
    limit,
    status,
    visitDate,
  });

  return <VisitsTable initialData={visitsData} currentDate={visitDate} />;
}
