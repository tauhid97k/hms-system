import { client } from "@/lib/orpc";
import { DoctorProfile } from "./_components/doctor-profile";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch doctor details
  const doctor = await client.doctors.getOne(id);

  if (!doctor) {
    notFound();
  }

  // Fetch recent visits for this doctor
  const visitsData = await client.visits.getAll({
    page: 1,
    limit: 10,
    doctorId: id,
  });

  return <DoctorProfile doctor={doctor} recentVisits={visitsData.data} />;
}
