import { client } from "@/lib/orpc";
import { DoctorQueueDetail } from "./_components/doctor-queue-detail";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DoctorQueuePage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;

  // Fetch doctor details
  const doctor = await client.doctors.getOne(doctorId);

  if (!doctor) {
    notFound();
  }

  // Fetch queue data
  const queue = await client.appointments.getQueue(doctorId);

  return <DoctorQueueDetail doctor={doctor} initialQueue={queue} />;
}
