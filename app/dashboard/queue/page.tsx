import { client } from "@/lib/orpc";
import { QueueTable } from "./_components/queue-table";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Appointment = {
  id: string;
  doctorId: string;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
};

export default async function QueuePage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const doctorId = searchParams.doctorId
    ? String(searchParams.doctorId)
    : undefined;
  const status = searchParams.status
    ? (String(searchParams.status) as
        | "WAITING"
        | "IN_CONSULTATION"
        | "COMPLETED"
        | "CANCELLED")
    : undefined;

  // Default to today's date
  const appointmentDate = format(new Date(), "yyyy-MM-dd");

  // Fetch all available doctors for filter
  const doctorsData = await client.doctors.getAll({
    page: 1,
    limit: 100,
    isAvailable: "true",
  });

  // Fetch appointments with filters
  const appointmentsData = await client.appointments.getAll({
    page: 1,
    limit: 100, // API limit is max 100
    doctorId,
    status,
    appointmentDate,
  });

  // Group appointments by doctor and calculate counts
  const queuesData = doctorsData.data
    .map((doctor) => {
      const doctorAppointments = appointmentsData.data.filter(
        (appointment: Appointment) => appointment.doctorId === doctor.id,
      );

      const waitingCount = doctorAppointments.filter(
        (appointment: Appointment) => appointment.status === "WAITING",
      ).length;
      const consultingCount = doctorAppointments.filter(
        (appointment: Appointment) => appointment.status === "IN_CONSULTATION",
      ).length;
      const totalInQueue = waitingCount + consultingCount;

      return {
        doctor,
        waitingCount,
        consultingCount,
        totalInQueue,
        appointments: doctorAppointments, // Include appointments for detailed view
      };
    })
    .filter(
      (queueData) => queueData.totalInQueue > 0 || (!doctorId && !status),
    ); // Show all if no filters, otherwise only filtered results

  return (
    <QueueTable
      initialData={queuesData}
      doctors={doctorsData.data}
    />
  );
}
