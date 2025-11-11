import { notFound } from "next/navigation";
import { client } from "@/lib/orpc";
import { PatientProfile } from "./_components/patient-profile";
import { AppointmentHistoryTable } from "./_components/appointment-history-table";

type PatientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params;

  try {
    const patient = await client.patients.getOne(id);

    if (!patient) {
      notFound();
    }

    return (
      <div className="space-y-6">
        {/* Patient Profile Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <PatientProfile patient={patient as any} />
          </div>
          <div className="lg:col-span-2 lg:flex">
            <div className="flex-1 rounded-xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium">Patient Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-mono font-medium">{patient.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">
                    {patient.gender
                      ? patient.gender.charAt(0) +
                        patient.gender.slice(1).toLowerCase()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">
                    {patient.bloodGroup
                      ? patient.bloodGroup.replace("_", " ")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {patient.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                {patient.address && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                )}
                {patient.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Medical Notes</p>
                    <p className="font-medium">{patient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment History Section */}
        <div>
          <h2 className="mb-4 text-xl font-medium">Appointment History</h2>
          <AppointmentHistoryTable appointments={(patient as any).appointments || []} patientId={patient.id} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
