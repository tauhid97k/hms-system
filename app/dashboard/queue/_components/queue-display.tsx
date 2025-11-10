"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Doctor } from "@/lib/dataTypes";

type Visit = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  visitType: "NEW" | "FOLLOWUP";
  chiefComplaint: string | null;
  visitDate: Date;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string | null;
    phone: string;
  };
};

type QueueDisplayProps = {
  doctor: Doctor;
  initialQueue: Visit[];
};

const statusColors = {
  WAITING: "bg-yellow-500",
  IN_CONSULTATION: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

const statusLabels = {
  WAITING: "Waiting",
  IN_CONSULTATION: "In Consultation",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function QueueDisplay({ doctor, initialQueue }: QueueDisplayProps) {
  const [queue, setQueue] = useState<Visit[]>(initialQueue);

  // TODO: Add WebSocket subscription for real-time updates
  useEffect(() => {
    // Placeholder for WebSocket subscription
    // We'll implement this in the next iteration
    console.log("Queue display mounted for doctor:", doctor.id);

    return () => {
      console.log("Queue display unmounted");
    };
  }, [doctor.id]);

  const waitingCount = queue.filter((v) => v.status === "WAITING").length;
  const inConsultationCount = queue.filter(
    (v) => v.status === "IN_CONSULTATION"
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Dr. {doctor.user?.name || "Unknown"}
          {doctor.employeeDepartments && doctor.employeeDepartments[0] && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({doctor.employeeDepartments[0].department.name})
            </span>
          )}
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Waiting: </span>
            <span className="font-medium">{waitingCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">In Consultation: </span>
            <span className="font-medium">{inConsultationCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No patients in queue
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 min-w-[60px]">
                    <span className="text-xs text-muted-foreground">Serial</span>
                    <span className="text-lg font-bold">{visit.serialNumber}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-[60px]">
                    <span className="text-xs text-muted-foreground">Queue</span>
                    <span className="text-lg font-medium">{visit.queuePosition}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{visit.patient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({visit.patient.patientId})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{visit.patient.age}y</span>
                      <span>•</span>
                      <span>{visit.patient.gender || "N/A"}</span>
                      <span>•</span>
                      <span>{visit.patient.phone}</span>
                    </div>
                    {visit.chiefComplaint && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {visit.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={visit.visitType === "NEW" ? "default" : "secondary"}
                  >
                    {visit.visitType}
                  </Badge>
                  <Badge
                    className={`${statusColors[visit.status]} text-white`}
                    variant="default"
                  >
                    {statusLabels[visit.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
