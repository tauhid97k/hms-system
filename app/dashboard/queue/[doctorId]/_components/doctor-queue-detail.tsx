"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Doctor } from "@/lib/dataTypes";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { LuArrowLeft, LuEye } from "react-icons/lu";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { LuEllipsisVertical } from "react-icons/lu";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const safeClient = createSafeClient(client);

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

type DoctorQueueDetailProps = {
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

export function DoctorQueueDetail({
  doctor,
  initialQueue,
}: DoctorQueueDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const waitingCount = initialQueue.filter((a) => a.status === "WAITING").length;
  const consultingCount = initialQueue.filter(
    (a) => a.status === "IN_CONSULTATION"
  ).length;

  const handleStatusChange = async (
    appointmentId: string,
    status: string,
    employeeId: string
  ) => {
    setIsUpdating(appointmentId);

    const { error } = await safeClient.appointments.updateStatus({
      id: appointmentId,
      status: status as any,
      performedBy: employeeId,
    });

    if (error) {
      toast.error(error.message || "Failed to update appointment status");
    } else {
      toast.success(
        `Appointment status updated to ${
          statusLabels[status as keyof typeof statusLabels]
        }`
      );
      router.refresh();
    }

    setIsUpdating(null);
  };

  const handleCallNext = async (employeeId: string) => {
    setIsUpdating("calling");

    const { error } = await safeClient.appointments.callNextPatient({
      doctorId: doctor.id,
      performedBy: employeeId,
    });

    if (error) {
      toast.error(error.message || "Failed to call next patient");
    } else {
      toast.success("Next patient called");
      router.refresh();
    }

    setIsUpdating(null);
  };

  // Get employee ID from doctor (temporary - should come from session)
  const employeeId = doctor.id;

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "serialNumber",
      header: "Serial #",
      cell: ({ row }) => (
        <div className="font-mono font-bold">#{row.original.serialNumber}</div>
      ),
    },
    {
      accessorKey: "queuePosition",
      header: "Queue Position",
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.queuePosition}
        </div>
      ),
    },
    {
      accessorKey: "patient.name",
      header: "Patient",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.patient.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.patient.patientId} • {row.original.patient.age}y •{" "}
            {row.original.patient.gender || "N/A"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "patient.phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.patient.phone}</div>
      ),
    },
    {
      accessorKey: "appointmentType",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.appointmentType === "NEW" ? "default" : "secondary"}
        >
          {row.original.appointmentType}
        </Badge>
      ),
    },
    {
      accessorKey: "chiefComplaint",
      header: "Appointment Reason",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm">
          {row.original.chiefComplaint || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={`${statusColors[row.original.status]} text-white`}
          variant="default"
        >
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        const canUpdate =
          appointment.status === "WAITING" || appointment.status === "IN_CONSULTATION";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isUpdating === appointment.id}
              >
                <span className="sr-only">Open menu</span>
                <LuEllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/patients/${appointment.patient.id}`}>
                  <LuEye />
                  View Patient
                </Link>
              </DropdownMenuItem>
              {canUpdate && (
                <>
                  {appointment.status === "WAITING" && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(appointment.id, "IN_CONSULTATION", employeeId)
                      }
                    >
                      Mark as In Consultation
                    </DropdownMenuItem>
                  )}
                  {appointment.status === "IN_CONSULTATION" && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(appointment.id, "COMPLETED", employeeId)
                      }
                    >
                      Mark as Completed
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      handleStatusChange(appointment.id, "CANCELLED", employeeId)
                    }
                  >
                    Cancel Appointment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/queue">
            <LuArrowLeft />
            Back to Queue
          </Link>
        </Button>

        {/* Doctor Info Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Left side - Avatar */}
            <Avatar className="h-20 w-20 shrink-0 md:h-24 md:w-24">
              <AvatarImage src={doctor.user?.avatar || undefined} />
              <AvatarFallback className="text-xl md:text-2xl">
                {doctor.user?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>

            {/* Right side - Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-xl font-semibold md:text-2xl">
                  Dr. {doctor.user?.name || "Unknown"}
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                  {doctor.user?.email}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Departments
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.employeeDepartments?.length ? (
                      doctor.employeeDepartments.map((ed) => (
                        <Badge key={ed.id} variant="secondary">
                          {ed.department.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.employeeSpecializations?.length ? (
                      doctor.employeeSpecializations.map((es) => (
                        <Badge key={es.id} variant="secondary">
                          {es.specialization.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Consultation Fee
                  </p>
                  <p className="text-lg font-semibold">
                    ${doctor.consultationFee?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-medium">Queue Patients</h2>
            <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
              <span>
                Currently Consulting:{" "}
                <strong className="font-semibold text-foreground">
                  {consultingCount}
                </strong>
              </span>
              <span>
                Waiting:{" "}
                <strong className="font-semibold text-foreground">
                  {waitingCount}
                </strong>
              </span>
            </div>
          </div>
          {waitingCount > 0 && (
            <Button
              onClick={() => handleCallNext(employeeId)}
              disabled={isUpdating === "calling"}
            >
              {isUpdating === "calling" ? "Calling..." : "Call Next Patient"}
            </Button>
          )}
        </div>

        <DataTable columns={columns} data={initialQueue} />
      </div>
    </>
  );
}
