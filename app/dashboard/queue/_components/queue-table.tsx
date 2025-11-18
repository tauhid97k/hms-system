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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

type QueueTableProps = {
  initialData: QueueData[];
  doctors: Doctor[];
};

export function QueueTable({ initialData, doctors }: QueueTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctorFilter, setDoctorFilter] = useState(
    searchParams.get("doctorId") || "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );

  const handleDoctorChange = (value: string) => {
    setDoctorFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("doctorId");
    } else {
      params.set("doctorId", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
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
            {row.original.doctor.user?.name || "Unknown"}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.doctor.user?.email}
          </div>
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
      accessorKey: "consultingCount",
      header: () => <div className="text-center">Currently Consulting</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.consultingCount > 0 ? (
            <Badge variant="default">{row.original.consultingCount}</Badge>
          ) : (
            <Badge variant="secondary">0</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "waitingCount",
      header: () => <div className="text-center">Waiting</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.waitingCount > 0 ? (
            <Badge variant="warning">{row.original.waitingCount}</Badge>
          ) : (
            <Badge variant="secondary">0</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "totalInQueue",
      header: () => <div className="text-center">Total in Queue</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary">{row.original.totalInQueue}</Badge>
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
          <Select value={doctorFilter} onValueChange={handleDoctorChange}>
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

          <Select value={statusFilter} onValueChange={handleStatusChange}>
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
