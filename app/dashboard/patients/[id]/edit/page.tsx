import { notFound } from "next/navigation";
import { client } from "@/lib/orpc";
import { EditPatientForm } from "./_components/edit-patient-form";

type EditPatientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = await params;

  try {
    const patient = await client.patients.getOne(id);

    if (!patient) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Edit Patient</h1>
          <p className="text-sm text-muted-foreground">
            Update patient information for {patient.name} (ID: {patient.patientId})
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <EditPatientForm patient={patient} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
