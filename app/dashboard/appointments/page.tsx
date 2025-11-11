import { client } from "@/lib/orpc";
import { AppointmentsTable } from "./_components/appointments-table";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AppointmentsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 20;
  const status = searchParams.status
    ? (String(searchParams.status) as "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED")
    : undefined;
  const doctorId = searchParams.doctorId ? String(searchParams.doctorId) : undefined;

  // Default to today's date if no date filter
  const appointmentDate = searchParams.appointmentDate
    ? String(searchParams.appointmentDate)
    : format(new Date(), "yyyy-MM-dd");

  // Fetch all available doctors for filter
  const doctorsData = await client.doctors.getAll({
    page: 1,
    limit: 100,
    isAvailable: "true",
  });

  // Fetch appointments
  const appointmentsData = await client.appointments.getAll({
    page,
    limit,
    status,
    doctorId,
    appointmentDate,
  });

  return <AppointmentsTable initialData={appointmentsData} currentDate={appointmentDate} doctors={doctorsData.data} />;
}
