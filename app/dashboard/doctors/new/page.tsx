import { client } from "@/lib/orpc";
import { NewDoctorForm } from "./_components/new-doctor-form";

export default async function NewDoctorPage() {
  // Server-side data fetching
  const [departments, specializations] = await Promise.all([
    client.departments.getAll({ page: 1, limit: 100, isActive: "true" }),
    client.specializations.getAll({ page: 1, limit: 100, isActive: "true" }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Register New Doctor</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the doctor information. Required fields are marked with *.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <NewDoctorForm
          departments={departments.data}
          specializations={specializations.data}
        />
      </div>
    </div>
  );
}
