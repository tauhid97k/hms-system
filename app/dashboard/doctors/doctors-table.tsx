"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doctor, PaginatedData, Department, Specialization } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { LuEllipsisVertical, LuEye, LuPencil, LuPower, LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";
import Link from "next/link";

const safeClient = createSafeClient(client);

type DoctorsTableProps = {
  initialData: PaginatedData<Doctor>;
  departments: Department[];
  specializations: Specialization[];
};

export function DoctorsTable({ initialData, departments, specializations }: DoctorsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);
  const [departmentFilter, setDepartmentFilter] = useState(
    searchParams.get("departmentId") || "all",
  );
  const [specializationFilter, setSpecializationFilter] = useState(
    searchParams.get("specializationId") || "all",
  );
  const [availabilityFilter, setAvailabilityFilter] = useState(
    searchParams.get("isAvailable") || "all",
  );

  // Auto-search when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch !== (searchParams.get("search") || "")) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, router, searchParams]);

  // Handle department filter change
  const handleDepartmentChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    setDepartmentFilter(value);
    if (value === "all") {
      params.delete("departmentId");
    } else {
      params.set("departmentId", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle specialization filter change
  const handleSpecializationChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    setSpecializationFilter(value);
    if (value === "all") {
      params.delete("specializationId");
    } else {
      params.set("specializationId", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle availability filter change
  const handleAvailabilityChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    setAvailabilityFilter(value);
    if (value === "all") {
      params.delete("isAvailable");
    } else {
      params.set("isAvailable", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle Page Change
  const handlePageChange = (page: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle Limit Change
  const handleLimitChange = (limit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleToggleAvailability = async (doctor: Doctor) => {
    const { error } = await safeClient.doctors.toggleAvailability(doctor.id);

    if (error) {
      toast.error(error.message || "Failed to update availability");
    } else {
      toast.success(
        `Doctor ${doctor.isAvailable ? "marked as unavailable" : "marked as available"}`,
      );
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deletingDoctor) return;

    setIsDeleting(true);
    const { error } = await safeClient.doctors.delete(deletingDoctor.id);

    if (error) {
      toast.error(error.message || "Failed to delete doctor");
    } else {
      toast.success("Doctor deleted successfully");
      setDeletingDoctor(null);
      router.refresh();
    }
    setIsDeleting(false);
  };

  const columns: ColumnDef<Doctor>[] = [
    {
      accessorKey: "user.name",
      header: "Doctor Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.user?.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.user?.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "employeeDepartments",
      header: "Departments",
      cell: ({ row }) => {
        const departments = row.original.employeeDepartments || [];
        if (departments.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {departments.map((ed) => (
              <Badge key={ed.id} variant="secondary">
                {ed.department.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "employeeSpecializations",
      header: "Specializations",
      cell: ({ row }) => {
        const specializations = row.original.employeeSpecializations || [];
        if (specializations.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {specializations.map((es) => (
              <Badge key={es.id} variant="secondary">
                {es.specialization.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "qualification",
      header: "Qualification",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm">
          {row.original.qualification || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "consultationFee",
      header: "Consultation Fee",
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.consultationFee !== null
            ? `$${row.original.consultationFee.toFixed(2)}`
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "isAvailable",
      header: "Availability",
      cell: ({ row }) => (
        <Badge variant={row.original.isAvailable ? "default" : "secondary"}>
          {row.original.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      ),
    },
    {
      accessorKey: "_count.doctorAppointments",
      header: "Appointments",
      cell: ({ row }) => (
        <div className="text-sm">{row.original._count?.doctorAppointments || 0}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const doctor = row.original;

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
                <Link href={`/dashboard/doctors/${doctor.id}`}>
                  <LuEye />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/doctors/${doctor.id}/edit`}>
                  <LuPencil />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleAvailability(doctor)}>
                <LuPower />
                {doctor.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeletingDoctor(doctor)}
              >
                <LuTrash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Doctors</h1>
        <Button asChild>
          <Link href="/dashboard/doctors/new">Add Doctor</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4 pb-6">
          <Input
            type="search"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={departmentFilter}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={specializationFilter}
            onValueChange={handleSpecializationChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map((spec) => (
                <SelectItem key={spec.id} value={spec.id}>
                  {spec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availabilityFilter}
            onValueChange={handleAvailabilityChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Unavailable</SelectItem>
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

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingDoctor}
        onOpenChange={(open) => !open && setDeletingDoctor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Dr. {deletingDoctor?.user?.name}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
