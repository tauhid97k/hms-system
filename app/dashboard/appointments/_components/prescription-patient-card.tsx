import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LuCalendar, LuClock, LuHistory, LuUser } from "react-icons/lu";
import { formatDateTime } from "@/lib/date-format";
import type { AppointmentForPrescription } from "@/lib/dataTypes";

type PrescriptionPatientCardProps = {
  appointment: AppointmentForPrescription;
  onViewHistory?: () => void;
};

export function PrescriptionPatientCard({
  appointment,
  onViewHistory,
}: PrescriptionPatientCardProps) {
  const { patient, appointmentType, appointmentDate, serialNumber } = appointment;
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderDisplay = (gender: string | null) => {
    if (!gender) return "N/A";
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Patient Info */}
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="size-16">
            <AvatarImage src="" alt={patient.name} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {getInitials(patient.name)}
            </AvatarFallback>
          </Avatar>

          {/* Patient Details */}
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold">{patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                ID: {patient.patientId}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <LuUser className="size-4 text-muted-foreground" />
                <span>
                  {patient.age} yrs • {getGenderDisplay(patient.gender)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <LuCalendar className="size-4 text-muted-foreground" />
                <span>{formatDateTime(appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <LuClock className="size-4 text-muted-foreground" />
                <span>Serial #{serialNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Appointment Type & History */}
        <div className="flex flex-col items-end gap-3">
          <Badge
            variant={appointmentType === "NEW" ? "default" : "secondary"}
            className="text-xs"
          >
            {appointmentType === "NEW" ? "New Visit" : "Follow-up"}
          </Badge>

          {appointmentType === "FOLLOWUP" && onViewHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewHistory}
              className="gap-2"
            >
              <LuHistory className="size-4" />
              View History
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
