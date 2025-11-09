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
import type { Patient, PaginatedData } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { LuEllipsisVertical, LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";
import Link from "next/link";

const safeClient = createSafeClient(client);

type PatientsTableProps = {
  initialData: PaginatedData<Patient>;
};

// Helper to format blood group for display
const formatBloodGroup = (bloodGroup: string | null) => {
  if (!bloodGroup) return null;
  return bloodGroup.replace("_", " ");
};

// Helper to format gender for display
const formatGender = (gender: string | null) => {
  if (!gender) return null;
  return gender.charAt(0) + gender.slice(1).toLowerCase();
};

export function PatientsTable({ initialData }: PatientsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);
  const [genderFilter, setGenderFilter] = useState(
    searchParams.get("gender") || "all",
  );
  const [bloodGroupFilter, setBloodGroupFilter] = useState(
    searchParams.get("bloodGroup") || "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("isActive") || "all",
  );

  // Auto-search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("search") || "")) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch]);

  // Handle gender filter change
  const handleGenderChange = (value: string) => {
    setGenderFilter(value);
    if (value === "all") {
      params.delete("gender");
    } else {
      params.set("gender", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle blood group filter change
  const handleBloodGroupChange = (value: string) => {
    setBloodGroupFilter(value);
    if (value === "all") {
      params.delete("bloodGroup");
    } else {
      params.set("bloodGroup", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    if (value === "all") {
      params.delete("isActive");
    } else {
      params.set("isActive", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle Page Change
  const handlePageChange = (page: string) => {
    params.set("page", page);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle Limit Change
  const handleLimitChange = (limit: string) => {
    params.set("limit", limit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleDelete = async () => {
    if (!deletingPatient) return;

    setIsDeleting(true);
    const { error } = await safeClient.patients.delete(deletingPatient.id);

    if (error) {
      toast.error(error.message || "Failed to delete patient");
    } else {
      toast.success("Patient deleted successfully");
      setDeletingPatient(null);
      router.refresh();
    }
    setIsDeleting(false);
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "patientId",
      header: "Patient ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.original.patientId}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => <div className="text-sm">{row.original.age}</div>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatGender(row.original.gender) || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood Group",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatBloodGroup(row.original.bloodGroup) || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
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
        const patient = row.original;

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
                <Link href={`/dashboard/patients/${patient.id}`}>
                  <LuEye />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/patients/${patient.id}/edit`}>
                  <LuPencil />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeletingPatient(patient)}
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
        <h1 className="text-2xl font-medium">Patients</h1>
        <Button asChild>
          <Link href="/dashboard/patients/new">Add Patient</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4 pb-6">
          <Input
            type="search"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={genderFilter} onValueChange={handleGenderChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={bloodGroupFilter}
            onValueChange={handleBloodGroupChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood Groups</SelectItem>
              <SelectItem value="A_POSITIVE">A+</SelectItem>
              <SelectItem value="A_NEGATIVE">A-</SelectItem>
              <SelectItem value="B_POSITIVE">B+</SelectItem>
              <SelectItem value="B_NEGATIVE">B-</SelectItem>
              <SelectItem value="AB_POSITIVE">AB+</SelectItem>
              <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
              <SelectItem value="O_POSITIVE">O+</SelectItem>
              <SelectItem value="O_NEGATIVE">O-</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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
        open={!!deletingPatient}
        onOpenChange={(open) => !open && setDeletingPatient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the patient &quot;
              {deletingPatient?.name}&quot; (ID: {deletingPatient?.patientId}).
              This action cannot be undone.
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
