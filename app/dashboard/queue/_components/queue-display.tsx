"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueueStream } from "@/lib/hooks/use-queue-stream";
import { LuRefreshCw, LuWifi, LuWifiOff } from "react-icons/lu";
import type { Doctor } from "@/lib/dataTypes";

type Appointment = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  appointmentType: "NEW" | "FOLLOWUP";
  chiefComplaint: string | null;
  appointmentDate: Date;
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
  initialQueue: Appointment[];
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
  const [queue, setQueue] = useState<Appointment[]>(initialQueue);

  // Subscribe to real-time updates via SSE
  const { queue: liveQueue, isConnected, error, reconnect } = useQueueStream({
    doctorId: doctor.id,
    enabled: true,
    onUpdate: (updatedQueue) => {
      setQueue(updatedQueue);
    },
    onError: (err) => {
      console.error("Queue stream error:", err);
    },
  });

  // Use live queue if available, otherwise fall back to local state
  const displayQueue = liveQueue.length > 0 ? liveQueue : queue;

  const waitingCount = displayQueue.filter((a) => a.status === "WAITING").length;
  const inConsultationCount = displayQueue.filter(
    (a) => a.status === "IN_CONSULTATION"
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Dr. {doctor.user?.name || "Unknown"}
            {doctor.department && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({doctor.department.name})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="gap-1.5 border-green-500 text-green-500">
                <LuWifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 border-red-500 text-red-500">
                <LuWifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {error && (
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                className="gap-1.5"
              >
                <LuRefreshCw className="h-3.5 w-3.5" />
                Reconnect
              </Button>
            )}
          </div>
        </div>
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
        {displayQueue.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No patients in queue
          </div>
        ) : (
          <div className="space-y-2">
            {displayQueue.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 min-w-[60px]">
                    <span className="text-xs text-muted-foreground">Serial</span>
                    <span className="text-lg font-bold">{appointment.serialNumber}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-[60px]">
                    <span className="text-xs text-muted-foreground">Queue</span>
                    <span className="text-lg font-medium">{appointment.queuePosition}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appointment.patient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({appointment.patient.patientId})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{appointment.patient.age}y</span>
                      <span>•</span>
                      <span>{appointment.patient.gender || "N/A"}</span>
                      <span>•</span>
                      <span>{appointment.patient.phone}</span>
                    </div>
                    {appointment.chiefComplaint && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {appointment.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={appointment.appointmentType === "NEW" ? "default" : "secondary"}
                  >
                    {appointment.appointmentType}
                  </Badge>
                  <Badge
                    className={`${statusColors[appointment.status]} text-white`}
                    variant="default"
                  >
                    {statusLabels[appointment.status]}
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
