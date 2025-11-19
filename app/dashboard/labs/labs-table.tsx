"use client";

import {
  AdvancedSelect,
  AdvancedSelectOption,
} from "@/components/ui/advanced-select";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import type { Department, PaginatedData } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import { labSchema, type LabSchemaType } from "@/schema/labSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuEllipsisVertical, LuPencil, LuTrash } from "react-icons/lu";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

type Lab = {
  id: string;
  name: string;
  code: string;
  departmentId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  department?: {
    id: string;
    name: string;
  } | null;
};

const safeClient = createSafeClient(client);

const LabsTable = ({
  labs,
  departments,
}: {
  labs: PaginatedData<Lab>;
  departments: Department[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Convert departments to options
  const departmentOptions: AdvancedSelectOption[] = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  // Create form
  const createForm = useForm({
    resolver: yupResolver(labSchema),
    defaultValues: {
      name: "",
      code: "",
      departmentId: "",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm({
    resolver: yupResolver(labSchema),
    defaultValues: {
      name: "",
      code: "",
      departmentId: "",
      description: "",
    },
  });

  // Handle Create Submit
  const onCreateSubmit = async (data: LabSchemaType) => {
    const { error } = await safeClient.labs.create(data);
    if (error) {
      toast.error(error.message || "Failed to create lab");
      return;
    }
    setOpenCreateDialog(false);
    toast.success("Lab created successfully");
    router.refresh();
    createForm.reset();
  };

  // Handle Edit Submit
  const onEditSubmit = async (data: LabSchemaType) => {
    if (!selectedLab) return;

    const { error } = await safeClient.labs.update({
      id: selectedLab.id,
      ...data,
    });
    if (error) {
      toast.error(error.message || "Failed to update lab");
      return;
    }
    setOpenEditDialog(false);
    setSelectedLab(null);
    toast.success("Lab updated successfully");
    router.refresh();
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedLab) return;

    const { error } = await safeClient.labs.delete(selectedLab.id);
    if (error) {
      toast.error(error.message || "Failed to delete lab");
      return;
    }
    setOpenDeleteDialog(false);
    setSelectedLab(null);
    toast.success("Lab deleted successfully");
    router.refresh();
  };

  // Debounced search handler
  const handleSearchDebounced = useDebounceCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params}`, { scroll: false });
  }, 500);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleSearchDebounced(value);
  };

  // Handle Page Change
  const handlePageChange = (page: string) => {
    params.set("page", page);
    router.push(`?${params}`, { scroll: false });
  };

  // Handle Limit Change
  const handleLimitChange = (limit: string) => {
    params.set("limit", limit);
    params.set("page", "1");
    router.push(`?${params}`, { scroll: false });
  };

  // Open Edit Dialog
  const openEdit = (lab: Lab) => {
    setSelectedLab(lab);
    editForm.reset({
      name: lab.name,
      code: lab.code,
      departmentId: lab.departmentId || "",
      description: lab.description || "",
    });
    setOpenEditDialog(true);
  };

  // Table Columns
  const columns: ColumnDef<Lab>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Department",
      accessorKey: "department.name",
      cell: ({ row }) => row.original.department?.name || "-",
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      header: "Action",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild suppressHydrationWarning>
              <Button variant="outline" size="icon">
                <LuEllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <LuPencil />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelectedLab(row.original);
                  setOpenDeleteDialog(true);
                }}
              >
                <LuTrash />
                <span>Delete</span>
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
        <h1 className="text-2xl font-medium">Labs</h1>
        <Button onClick={() => setOpenCreateDialog(true)}>Add Lab</Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            type="search"
            placeholder="Search labs..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <DataTable data={labs.data} columns={columns} />
        <Pagination
          meta={labs.meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lab</DialogTitle>
            <DialogDescription>Fill in the lab details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="name"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">
                        Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} id="name" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="code"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="code">
                        Code <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} id="code" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="departmentId"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="departmentId">Department</FieldLabel>
                      <AdvancedSelect
                        value={field.value || undefined}
                        onChange={field.onChange}
                        options={departmentOptions}
                        placeholder="Select department (optional)"
                        className="w-full"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Textarea
                        {...field}
                        id="description"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setOpenCreateDialog(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createForm.formState.isSubmitting}
                >
                  Add Lab
                </Button>
              </div>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lab</DialogTitle>
            <DialogDescription>Update the lab details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="name"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-name">
                        Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} id="edit-name" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="code"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-code">
                        Code <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} id="edit-code" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="departmentId"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-departmentId">
                        Department
                      </FieldLabel>
                      <AdvancedSelect
                        value={field.value || undefined}
                        onChange={field.onChange}
                        options={departmentOptions}
                        placeholder="Select department (optional)"
                        className="w-full"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-description">
                        Description
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="edit-description"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setOpenEditDialog(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={editForm.formState.isSubmitting}
                >
                  Update Lab
                </Button>
              </div>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lab? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LabsTable;
