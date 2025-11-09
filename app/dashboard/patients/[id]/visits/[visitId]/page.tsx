import { notFound } from "next/navigation";
import { client } from "@/lib/orpc";
import { VisitTimeline } from "./_components/visit-timeline";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

type VisitJourneyPageProps = {
  params: Promise<{ id: string; visitId: string }>;
};

export default async function VisitJourneyPage({ params }: VisitJourneyPageProps) {
  const { id, visitId } = await params;

  try {
    const visit = await client.visits.getOne(visitId);

    if (!visit) {
      notFound();
    }

    const statusMap: Record<string, { label: string; variant: any }> = {
      PENDING: { label: "Pending", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "default" },
      COMPLETED: { label: "Completed", variant: "default" },
      CANCELLED: { label: "Cancelled", variant: "secondary" },
    };

    const status = statusMap[visit.status] || {
      label: visit.status,
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
            <h1 className="text-2xl font-medium">Visit Journey</h1>
            <p className="text-sm text-muted-foreground">
              Complete timeline for {visit.patient.name} ({visit.patient.patientId})
            </p>
          </div>
        </div>

        {/* Visit Summary */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-medium">Visit Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Visit Date</p>
              <p className="font-medium">{formatDateTime(visit.visitDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">
                {visit.department?.name || (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Doctor</p>
              <p className="font-medium">
                {visit.doctor?.user?.name || (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {visit.chiefComplaint && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Chief Complaint</p>
                <p className="font-medium">{visit.chiefComplaint}</p>
              </div>
            )}
            {visit.diagnosis && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="font-medium">{visit.diagnosis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="mb-4 text-lg font-medium">Patient Journey Timeline</h2>
          <VisitTimeline journey={visit.journey} visit={visit} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
