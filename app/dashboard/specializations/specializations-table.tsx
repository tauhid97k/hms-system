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
import type { PaginatedData } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { LuEllipsisVertical, LuPencil, LuPower, LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";
import { CreateSpecializationDialog } from "./create-specialization-dialog";
import { EditSpecializationDialog } from "./edit-specialization-dialog";

const safeClient = createSafeClient(client);

type Specialization = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    employeeSpecializations: number;
  };
};

type SpecializationsTableProps = {
  initialData: PaginatedData<Specialization>;
};

export function SpecializationsTable({ initialData }: SpecializationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [deletingSpecialization, setDeletingSpecialization] = useState<Specialization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("isActive") || "all");

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
  }, [debouncedSearch, searchParams, params, router]);

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

  const handlePageChange = (page: string) => {
    params.set("page", page);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleLimitChange = (limit: string) => {
    params.set("limit", limit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleToggleStatus = async (specialization: Specialization) => {
    const { error } = await safeClient.specializations.toggleStatus(specialization.id);

    if (error) {
      toast.error(error.message || "Failed to update status");
    } else {
      toast.success(`Specialization ${specialization.isActive ? "deactivated" : "activated"}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deletingSpecialization) return;

    setIsDeleting(true);
    const { error } = await safeClient.specializations.delete(deletingSpecialization.id);

    if (error) {
      toast.error(error.message || "Failed to delete specialization");
    } else {
      toast.success("Specialization deleted successfully");
      setDeletingSpecialization(null);
      router.refresh();
    }
    setIsDeleting(false);
  };

  const columns: ColumnDef<Specialization>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <div className="font-mono text-sm">{row.original.code}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm text-muted-foreground">
          {row.original.description || "-"}
        </div>
      ),
    },
    {
      accessorKey: "_count.employeeSpecializations",
      header: "Employees",
      cell: ({ row }) => <div className="text-sm text-center">{row.original._count?.employeeSpecializations || 0}</div>,
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
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const specialization = row.original;

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
              <DropdownMenuItem onClick={() => setEditingSpecialization(specialization)}>
                <LuPencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(specialization)}>
                <LuPower />
                {specialization.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeletingSpecialization(specialization)}
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
        <h1 className="text-2xl font-medium">Specializations</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Add Specialization</Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4 pb-6">
          <Input
            type="search"
            placeholder="Search specializations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
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

      <CreateSpecializationDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {editingSpecialization && (
        <EditSpecializationDialog
          specialization={editingSpecialization}
          open={!!editingSpecialization}
          onOpenChange={(open) => !open && setEditingSpecialization(null)}
        />
      )}

      <AlertDialog
        open={!!deletingSpecialization}
        onOpenChange={(open) => !open && setDeletingSpecialization(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the specialization &quot;{deletingSpecialization?.name}&quot; (Code:{" "}
              {deletingSpecialization?.code}). This action cannot be undone.
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
