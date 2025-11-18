import { client } from "@/lib/orpc";
import { format } from "date-fns";
import { AppointmentsTable } from "./_components/appointments-table";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AppointmentsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 20;
  const status = searchParams.status
    ? (String(searchParams.status) as
        | "WAITING"
        | "IN_CONSULTATION"
        | "COMPLETED"
        | "CANCELLED")
    : undefined;
  const doctorId = searchParams.doctorId
    ? String(searchParams.doctorId)
    : undefined;

  // Default to today's date if no date filter
  const appointmentDate = searchParams.appointmentDate
    ? String(searchParams.appointmentDate)
    : format(new Date(), "yyyy-MM-dd");

  // Fetch all data in parallel
  const [doctorsData, appointmentsData] = await Promise.all([
    client.doctors.getAll({
      page: 1,
      limit: 100,
      isAvailable: "true",
    }),
    client.appointments.getAll({
      page,
      limit,
      status,
      doctorId,
      appointmentDate,
    }),
  ]);

  return (
    <AppointmentsTable
      initialData={appointmentsData}
      currentDate={appointmentDate}
      doctors={doctorsData.data}
    />
  );
}
