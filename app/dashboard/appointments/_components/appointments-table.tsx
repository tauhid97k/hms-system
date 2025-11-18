"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AppointmentTableRow,
  Doctor,
  PaginatedData,
} from "@/lib/dataTypes";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LuEllipsisVertical,
  LuPill,
  LuPrinter,
  LuStethoscope,
  LuUser,
} from "react-icons/lu";

type AppointmentsTableProps = {
  initialData: PaginatedData<AppointmentTableRow>;
  currentDate: string;
  doctors: Doctor[];
};

const statusConfig = {
  WAITING: { label: "Waiting", variant: "secondary" as const },
  IN_CONSULTATION: { label: "In Consultation", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "success" as const },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const },
};

export function AppointmentsTable({
  initialData,
  currentDate,
  doctors,
}: AppointmentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleDoctorChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("doctorId");
    } else {
      params.set("doctorId", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleLimitChange = (limit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const columns: ColumnDef<AppointmentTableRow>[] = [
    {
      accessorKey: "serialNumber",
      header: "Serial #",
      cell: ({ row }) => (
        <div className="font-mono font-bold">#{row.original.serialNumber}</div>
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
      accessorKey: "doctor.user.name",
      header: "Doctor",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.doctor.user?.name || "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "doctor.department",
      header: "Department",
      cell: ({ row }) => {
        const department = row.original.doctor.department;
        if (!department) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return <Badge variant="secondary">{department.name}</Badge>;
      },
    },
    {
      accessorKey: "appointmentType",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.appointmentType === "NEW" ? "default" : "secondary"
          }
        >
          {row.original.appointmentType}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "queuePosition",
      header: "Queue Position",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "WAITING" || status === "IN_CONSULTATION") {
          return (
            <div className="text-center">
              <Badge variant="secondary">{row.original.queuePosition}</Badge>
            </div>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "appointmentDate",
      header: "Time",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.appointmentDate), "h:mm a")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <LuEllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/patients/${appointment.patient.id}`}>
                  <LuUser />
                  View Patient
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/doctors/${appointment.doctor.id}`}>
                  <LuStethoscope />
                  View Doctor
                </Link>
              </DropdownMenuItem>
              {appointment.status === "IN_CONSULTATION" && (
                <DropdownMenuItem asChild>
                  <Link
                    href={{
                      pathname: `/dashboard/appointments/${appointment.id}/prescription`,
                    }}
                  >
                    <LuPill />
                    Prescribe
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <LuPrinter />
                Print Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Today&apos;s patient appointments -{" "}
            {format(new Date(currentDate), "MMMM d, yyyy")}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/appointments/new">New Appointment</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="WAITING">Waiting</SelectItem>
              <SelectItem value="IN_CONSULTATION">In Consultation</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("doctorId") || "all"}
            onValueChange={handleDoctorChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.user?.name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={initialData.data} />
        <Pagination
          meta={initialData.meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </>
  );
}
