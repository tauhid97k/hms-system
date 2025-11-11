import { client } from "@/lib/orpc";
import { QueueTable } from "./_components/queue-table";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  // Fetch all available doctors
  const doctorsData = await client.doctors.getAll({
    page: 1,
    limit: 100,
    isAvailable: "true",
  });

  // Fetch queue data for each doctor with counts
  const queuesData = await Promise.all(
    doctorsData.data.map(async (doctor) => {
      const queue = await client.appointments.getQueue(doctor.id);
      const waitingCount = queue.filter((a: any) => a.status === "WAITING").length;
      const consultingCount = queue.filter(
        (a: any) => a.status === "IN_CONSULTATION"
      ).length;

      return {
        doctor,
        waitingCount,
        consultingCount,
        totalInQueue: waitingCount + consultingCount,
      };
    })
  );

  return <QueueTable initialData={queuesData} />;
}
