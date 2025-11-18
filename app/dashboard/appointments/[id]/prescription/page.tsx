import { client } from "@/lib/orpc";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { NewPrescriptionForm } from "../../_components/new-prescription-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewPrescriptionPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch appointment details
  const appointment = await client.appointments.getOne(id);

  if (!appointment) {
    notFound();
  }

  // Check if prescription already exists
  const existingPrescription = await client.prescriptions.getByAppointment(id);

  if (existingPrescription) {
    // Redirect to view prescription if it already exists
    redirect(`/dashboard/appointments/${id}` as Route);
  }

  // Fetch medicines, instructions, and tests
  const [medicinesData, instructionsData, testsData] = await Promise.all([
    client.medicines.getAll({
      page: 1,
      limit: 100,
      search: "",
      isActive: "true",
    }),
    client.medicineInstructions.getAll({
      page: 1,
      limit: 100,
      search: "",
      isActive: "true",
    }),
    client.tests.getAll({
      page: 1,
      limit: 100,
      search: "",
      isActive: "true",
    }),
  ]);

  return (
    <NewPrescriptionForm
      appointment={appointment}
      medicines={medicinesData.data}
      instructions={instructionsData.data}
      testTypes={testsData.data}
    />
  );
}
