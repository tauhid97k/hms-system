"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import type { Doctor } from "@/lib/dataTypes";
import { ColumnDef } from "@tanstack/react-table";
import { LuArrowLeft, LuPencil } from "react-icons/lu";
import Link from "next/link";
import { format } from "date-fns";

type Visit = {
  id: string;
  serialNumber: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  visitType: "NEW" | "FOLLOWUP";
  visitDate: Date;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string | null;
  };
};

type DoctorProfileProps = {
  doctor: Doctor;
  recentVisits: Visit[];
};

const statusConfig = {
  WAITING: { label: "Waiting", variant: "secondary" as const },
  IN_CONSULTATION: { label: "In Consultation", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "outline" as const },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const },
};

export function DoctorProfile({ doctor, recentVisits }: DoctorProfileProps) {
  const columns: ColumnDef<Visit>[] = [
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
      accessorKey: "visitType",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.visitType === "NEW" ? "default" : "secondary"}
        >
          {row.original.visitType}
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
      accessorKey: "visitDate",
      header: "Visit Date",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.visitDate), "MMM d, yyyy h:mm a")}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/doctors">
            <LuArrowLeft />
            Back to Doctors
          </Link>
        </Button>

        {/* Doctor Profile Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Left side - Avatar */}
            <Avatar className="h-24 w-24 shrink-0 md:h-32 md:w-32">
              <AvatarImage src={doctor.user?.avatar || undefined} />
              <AvatarFallback className="text-2xl md:text-3xl">
                {doctor.user?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>

            {/* Right side - Info */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold md:text-3xl">
                      Dr. {doctor.user?.name || "Unknown"}
                    </h1>
                    <Badge variant={doctor.isAvailable ? "default" : "secondary"}>
                      {doctor.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {doctor.user?.email}
                  </p>
                  {doctor.user?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {doctor.user.phone}
                    </p>
                  )}
                </div>
                <Button asChild>
                  <Link href={`/dashboard/doctors/${doctor.id}/edit`}>
                    <LuPencil />
                    Edit Profile
                  </Link>
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
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
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
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
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Consultation Fee
                  </p>
                  <p className="text-xl font-semibold">
                    ${doctor.consultationFee?.toFixed(2) || "0.00"}
                  </p>
                </div>

                {doctor.qualification && (
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Qualifications
                    </p>
                    <p className="text-sm">{doctor.qualification}</p>
                  </div>
                )}

                {doctor.bio && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Biography
                    </p>
                    <p className="text-sm leading-relaxed">{doctor.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-6 text-lg font-medium">Recent Patient Visits</h2>
        {recentVisits.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No recent visits</p>
          </div>
        ) : (
          <DataTable columns={columns} data={recentVisits} />
        )}
      </div>
    </>
  );
}
