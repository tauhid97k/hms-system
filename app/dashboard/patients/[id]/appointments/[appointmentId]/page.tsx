import { notFound } from "next/navigation";
import { client } from "@/lib/orpc";
import { AppointmentTimeline } from "./_components/appointment-timeline";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

type AppointmentJourneyPageProps = {
  params: Promise<{ id: string; appointmentId: string }>;
};

export default async function AppointmentJourneyPage({ params }: AppointmentJourneyPageProps) {
  const { id, appointmentId } = await params;

  try {
    const appointment = await client.appointments.getOne(appointmentId);

    if (!appointment) {
      notFound();
    }

    const statusMap: Record<string, { label: string; variant: any }> = {
      PENDING: { label: "Pending", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "default" },
      COMPLETED: { label: "Completed", variant: "default" },
      CANCELLED: { label: "Cancelled", variant: "secondary" },
    };

    const status = statusMap[appointment.status] || {
      label: appointment.status,
      variant: "secondary",
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/patients/${id}`}>
              <LuArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-medium">Appointment Journey</h1>
            <p className="text-sm text-muted-foreground">
              Complete timeline for {appointment.patient.name} ({appointment.patient.patientId})
            </p>
          </div>
        </div>

        {/* Appointment Summary */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-medium">Appointment Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Appointment Date</p>
              <p className="font-medium">{formatDateTime(appointment.appointmentDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">
                {(appointment as any).doctor?.employeeDepartments?.[0]?.department?.name || (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Doctor</p>
              <p className="font-medium">
                {appointment.doctor?.user?.name || (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {appointment.chiefComplaint && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Chief Complaint</p>
                <p className="font-medium">{appointment.chiefComplaint}</p>
              </div>
            )}
            {appointment.diagnosis && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="font-medium">{appointment.diagnosis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="mb-4 text-lg font-medium">Patient Journey Timeline</h2>
          <AppointmentTimeline journey={(appointment as any).appointmentEvents || []} appointment={appointment} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
