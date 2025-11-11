import { notFound } from "next/navigation";
import { client } from "@/lib/orpc";
import { EditDoctorForm } from "./_components/edit-doctor-form";

type EditDoctorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDoctorPage({ params }: EditDoctorPageProps) {
  const { id } = await params;

  try {
    // Server-side data fetching
    const [doctor, departments, specializations] = await Promise.all([
      client.doctors.getOne(id),
      client.departments.getAll({ page: 1, limit: 100, isActive: "true" }),
      client.specializations.getAll({ page: 1, limit: 100, isActive: "true" }),
    ]);

    if (!doctor) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Edit Doctor</h1>
          <p className="text-sm text-muted-foreground">
            Update doctor information for {(doctor as any).user?.name}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <EditDoctorForm
            doctor={doctor}
            departments={departments.data}
            specializations={specializations.data}
          />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
