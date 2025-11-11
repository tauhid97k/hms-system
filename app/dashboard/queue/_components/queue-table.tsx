"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doctor } from "@/lib/dataTypes";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LuEye } from "react-icons/lu";

type QueueData = {
  doctor: Doctor;
  waitingCount: number;
  consultingCount: number;
  totalInQueue: number;
  appointments?: Appointment[];
};

type Appointment = {
  id: string;
  doctorId: string;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
};

type QueueFilters = {
  doctorId?: string;
  status?: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
};

type QueueTableProps = {
  initialData: QueueData[];
  doctors: Doctor[];
  currentFilters: QueueFilters;
};

export function QueueTable({ initialData, doctors, currentFilters }: QueueTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDoctorChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("doctorId");
    } else {
      params.set("doctorId", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const columns: ColumnDef<QueueData>[] = [
    {
      accessorKey: "doctor.user.name",
      header: "Doctor Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            Dr. {row.original.doctor.user?.name || "Unknown"}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.doctor.user?.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "doctor.employeeDepartments",
      header: "Department",
      cell: ({ row }) => {
        const departments = row.original.doctor.employeeDepartments || [];
        if (departments.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {departments.slice(0, 2).map((ed) => (
              <Badge key={ed.id} variant="secondary">
                {ed.department.name}
              </Badge>
            ))}
            {departments.length > 2 && (
              <Badge variant="secondary">+{departments.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "consultingCount",
      header: () => <div className="text-center">Currently Consulting</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.consultingCount > 0 ? (
            <Badge className="bg-blue-500 text-white" variant="default">
              {row.original.consultingCount}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "waitingCount",
      header: () => <div className="text-center">Waiting</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.waitingCount > 0 ? (
            <Badge className="bg-yellow-500 text-white" variant="default">
              {row.original.waitingCount}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">0</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "totalInQueue",
      header: () => <div className="text-center">Total in Queue</div>,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.totalInQueue}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/queue/${row.original.doctor.id}`}>
            <LuEye />
            View Queue
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Patient Queue</h1>
          <p className="text-sm text-muted-foreground">
            Real-time view of patient queues for all doctors
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <Select
            value={currentFilters.doctorId || "all"}
            onValueChange={handleDoctorChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  Dr. {doctor.user?.name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.status || "all"}
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
        </div>

        <DataTable columns={columns} data={initialData} />
      </div>
    </>
  );
}
