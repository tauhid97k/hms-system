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
import type { Medicine, PaginatedData } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import {
  medicineSchema,
  type MedicineSchemaType,
} from "@/schema/medicineSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuEllipsisVertical, LuPencil, LuTrash } from "react-icons/lu";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

const safeClient = createSafeClient(client);

const MedicinesTable = ({
  medicines,
}: {
  medicines: PaginatedData<Medicine>;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Create form
  const createForm = useForm({
    resolver: yupResolver(medicineSchema),
    defaultValues: {
      name: "",
      genericName: "",
      type: "",
      manufacturer: "",
      strength: "",
      price: null,
      stock: null,
      minStock: null,
    },
  });

  // Edit form
  const editForm = useForm({
    resolver: yupResolver(medicineSchema),
    defaultValues: {
      name: "",
      genericName: "",
      type: "",
      manufacturer: "",
      strength: "",
      price: null,
      stock: null,
      minStock: null,
    },
  });

  // Handle Create Submit
  const onCreateSubmit = async (data: MedicineSchemaType) => {
    const { error } = await safeClient.medicines.create(data);
    if (error) {
      toast.error(error.message || "Failed to create medicine");
      return;
    }
    setOpenCreateDialog(false);
    toast.success("Medicine created successfully");
    router.refresh();
    createForm.reset();
  };

  // Handle Edit Submit
  const onEditSubmit = async (data: MedicineSchemaType) => {
    if (!selectedMedicine) return;

    const { error } = await safeClient.medicines.update({
      id: selectedMedicine.id,
      ...data,
    });
    if (error) {
      toast.error(error.message || "Failed to update medicine");
      return;
    }
    setOpenEditDialog(false);
    setSelectedMedicine(null);
    toast.success("Medicine updated successfully");
    router.refresh();
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedMedicine) return;

    const { error } = await safeClient.medicines.delete(selectedMedicine.id);
    if (error) {
      toast.error(error.message || "Failed to delete medicine");
      return;
    }
    setOpenDeleteDialog(false);
    setSelectedMedicine(null);
    toast.success("Medicine deleted successfully");
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
  const openEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    editForm.reset({
      name: medicine.name,
      genericName: medicine.genericName || "",
      type: medicine.type || "",
      manufacturer: medicine.manufacturer || "",
      strength: medicine.strength || "",
      price: medicine.price,
      stock: medicine.stock,
      minStock: medicine.minStock,
    });
    setOpenEditDialog(true);
  };

  // Table Columns
  const columns: ColumnDef<Medicine>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Generic Name",
      accessorKey: "genericName",
      cell: ({ row }) => row.original.genericName || "-",
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => row.original.type || "-",
    },
    {
      header: "Manufacturer",
      accessorKey: "manufacturer",
      cell: ({ row }) => row.original.manufacturer || "-",
    },
    {
      header: "Strength",
      accessorKey: "strength",
      cell: ({ row }) => row.original.strength || "-",
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }) =>
        row.original.price ? `৳${row.original.price.toFixed(2)}` : "-",
    },
    {
      header: "Stock",
      accessorKey: "stock",
      cell: ({ row }) => row.original.stock ?? "-",
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
                  setSelectedMedicine(row.original);
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
        <h1 className="text-2xl font-medium">Medicines</h1>
        <Button onClick={() => setOpenCreateDialog(true)}>Add Medicine</Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            type="search"
            placeholder="Search medicines..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <DataTable data={medicines.data} columns={columns} />
        <Pagination
          meta={medicines.meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
            <DialogDescription>
              Fill in the medicine details below
            </DialogDescription>
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
                  name="genericName"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="genericName">
                        Generic Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="genericName"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="type">Type</FieldLabel>
                      <Input {...field} id="type" value={field.value || ""} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="manufacturer"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="manufacturer">
                        Manufacturer
                      </FieldLabel>
                      <Input
                        {...field}
                        id="manufacturer"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="strength"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="strength">Strength</FieldLabel>
                      <Input
                        {...field}
                        id="strength"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="price"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="price">Price</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        id="price"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="stock"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="stock">Stock</FieldLabel>
                      <Input
                        type="number"
                        {...field}
                        id="stock"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="minStock"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="minStock">Min Stock</FieldLabel>
                      <Input
                        type="number"
                        {...field}
                        id="minStock"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
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
                  Add Medicine
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
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>
              Update the medicine details below
            </DialogDescription>
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
                  name="genericName"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-genericName">
                        Generic Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="edit-genericName"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-type">Type</FieldLabel>
                      <Input
                        {...field}
                        id="edit-type"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="manufacturer"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-manufacturer">
                        Manufacturer
                      </FieldLabel>
                      <Input
                        {...field}
                        id="edit-manufacturer"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="strength"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-strength">Strength</FieldLabel>
                      <Input
                        {...field}
                        id="edit-strength"
                        value={field.value || ""}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="price"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-price">Price</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        id="edit-price"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="stock"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-stock">Stock</FieldLabel>
                      <Input
                        type="number"
                        {...field}
                        id="edit-stock"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="minStock"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-minStock">Min Stock</FieldLabel>
                      <Input
                        type="number"
                        {...field}
                        id="edit-minStock"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
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
                  Update Medicine
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
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot
              be undone.
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

export default MedicinesTable;
