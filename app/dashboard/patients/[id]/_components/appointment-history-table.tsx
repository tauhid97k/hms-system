"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/lib/date-format";
import Link from "next/link";

// Simplified Appointment type for the table
type Appointment = {
  id: string;
  appointmentDate: Date;
  status: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  createdAt: Date;
  doctor: {
    user: {
      name: string;
    };
  };
  department: {
    name: string;
  };
};

type AppointmentHistoryTableProps = {
  appointments: Appointment[];
  patientId: string;
};

export function AppointmentHistoryTable({ appointments, patientId }: AppointmentHistoryTableProps) {
  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "appointmentDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">{formatDateTime(row.original.appointmentDate)}</div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.department?.name}
        </div>
      ),
    },
    {
      accessorKey: "doctor",
      header: "Doctor",
      cell: ({ row }) => (
        <div className="text-sm">
          Dr. {row.original.doctor?.user?.name}
        </div>
      ),
    },
    {
      accessorKey: "tests",
      header: "Tests",
      cell: () => (
        <div className="text-sm">
          <span className="text-muted-foreground">0 Tests</span>
        </div>
      ),
    },
    {
      accessorKey: "chiefComplaint",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm">
          {row.original.chiefComplaint || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
          PENDING: { label: "Pending", variant: "secondary" },
          IN_PROGRESS: { label: "In Progress", variant: "default" },
          COMPLETED: { label: "Completed", variant: "default" },
          CANCELLED: { label: "Cancelled", variant: "secondary" },
        };

        const status = statusMap[row.original.status] || {
          label: row.original.status,
          variant: "secondary",
        };

        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;

        return (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/patients/${patientId}/appointments/${appointment.id}`}>
              View Journey
            </Link>
          </Button>
        );
      },
    },
  ];

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No appointment history found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <DataTable columns={columns} data={appointments} />
    </div>
  );
}
