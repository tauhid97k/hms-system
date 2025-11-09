"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { formatDateTime } from "@/lib/date-format";
import { ColumnDef } from "@tanstack/react-table";
import { LuEllipsisVertical, LuEye } from "react-icons/lu";
import Link from "next/link";

// Simplified Visit type for the table
type Visit = {
  id: string;
  visitDate: Date;
  status: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  createdAt: Date;
};

type VisitHistoryTableProps = {
  visits: Visit[];
  patientId: string;
};

export function VisitHistoryTable({ visits, patientId }: VisitHistoryTableProps) {
  const columns: ColumnDef<Visit>[] = [
    {
      accessorKey: "visitDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">{formatDateTime(row.original.visitDate)}</div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="text-muted-foreground">Not assigned</span>
        </div>
      ),
    },
    {
      accessorKey: "doctor",
      header: "Doctor",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="text-muted-foreground">Not assigned</span>
        </div>
      ),
    },
    {
      accessorKey: "tests",
      header: "Tests",
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="text-muted-foreground">0 Tests</span>
        </div>
      ),
    },
    {
      accessorKey: "chiefComplaint",
      header: "Chief Complaint",
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
        const statusMap: Record<string, { label: string; variant: any }> = {
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
      cell: ({ row }) => {
        const visit = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <LuEllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/patients/${patientId}/visits/${visit.id}`}>
                  <LuEye />
                  View Journey
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No visit history found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <DataTable columns={columns} data={visits} />
    </div>
  );
}
