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
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Lab, PaginatedData, TestTableRow } from "@/lib/dataTypes";
import { formatDateTime } from "@/lib/date-format";
import { client } from "@/lib/orpc";
import { testSchema, type TestSchemaType } from "@/schema/testSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { createSafeClient } from "@orpc/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuEllipsisVertical, LuPencil, LuPower, LuTrash } from "react-icons/lu";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

const safeClient = createSafeClient(client);

export const TestsTable = ({
  tests,
  labs,
}: {
  tests: PaginatedData<TestTableRow>;
  labs: Lab[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestTableRow | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Convert labs to options
  const labOptions: AdvancedSelectOption[] = labs.map((lab) => ({
    value: lab.id,
    label: `${lab.name} (${lab.code})`,
  }));

  // Create form
  const createForm = useForm({
    resolver: yupResolver(testSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      labId: null,
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm({
    resolver: yupResolver(testSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      labId: null,
      isActive: true,
    },
  });

  // Handle Create Submit
  const onCreateSubmit = async (data: TestSchemaType) => {
    const { error } = await safeClient.tests.create(data);
    if (error) {
      toast.error(error.message || "Failed to create test");
      return;
    }
    setOpenCreateDialog(false);
    toast.success("Test created successfully");
    router.refresh();
    createForm.reset();
  };

  // Handle Edit Submit
  const onEditSubmit = async (data: TestSchemaType) => {
    if (!selectedTest) return;

    const { error } = await safeClient.tests.update({
      id: selectedTest.id,
      ...data,
    });
    if (error) {
      toast.error(error.message || "Failed to update test");
      return;
    }
    setOpenEditDialog(false);
    setSelectedTest(null);
    toast.success("Test updated successfully");
    router.refresh();
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedTest) return;

    const { error } = await safeClient.tests.delete(selectedTest.id);
    if (error) {
      toast.error(error.message || "Failed to delete test");
      return;
    }
    setOpenDeleteDialog(false);
    setSelectedTest(null);
    toast.success("Test deleted successfully");
    router.refresh();
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: string) => {
    const { error } = await safeClient.tests.toggleStatus(id);
    if (error) {
      toast.error(error.message || "Failed to toggle test status");
      return;
    }
    toast.success("Test status updated successfully");
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

  // Handle Lab Filter
  const handleLabFilter = (value: string) => {
    if (value && value !== "all") {
      params.set("labId", value);
    } else {
      params.delete("labId");
    }
    params.set("page", "1");
    router.push(`?${params}`, { scroll: false });
  };

  // Handle Status Filter
  const handleStatusFilter = (value: string) => {
    params.set("isActive", value);
    params.set("page", "1");
    router.push(`?${params}`, { scroll: false });
  };

  // Handle Page Change
  const handlePageChange = (page: string) => {
    params.set("page", page);
    router.push(`?${params}`, { scroll: false });
  };

  // Handle Limit Change
  const handleLimitChange = (limit: string) => {
    params.set("limit", limit);
    router.push(`?${params}`, { scroll: false });
  };

  // Open Edit Dialog
  const openEdit = (test: TestTableRow) => {
    setSelectedTest(test);
    editForm.reset({
      name: test.name,
      code: test.code,
      description: test.description || "",
      price: test.price,
      labId: test.labId || null,
      isActive: test.isActive,
    });
    setOpenEditDialog(true);
  };

  // Table Columns
  const columns: ColumnDef<TestTableRow>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Lab",
      accessorKey: "lab.name",
      cell: ({ row }) =>
        row.original.lab?.name ? (
          row.original.lab.name
        ) : (
          <span className="text-center">-</span>
        ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }) => `৳${row.original.price}`,
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
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
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LuEllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleToggleStatus(row.original.id)}
              >
                <LuPower />
                <span>{row.original.isActive ? "Deactivate" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <LuPencil />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelectedTest(row.original);
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
        <h1 className="text-2xl font-medium">Tests</h1>
        <Button onClick={() => setOpenCreateDialog(true)}>Add Test</Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            type="search"
            placeholder="Search tests..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <AdvancedSelect
            value={searchParams.get("labId") || "all"}
            onChange={handleLabFilter}
            options={[{ value: "all", label: "All Labs" }, ...labOptions]}
            placeholder="Filter by lab"
            className="w-[200px]"
          />
          <Select
            value={searchParams.get("isActive") || "all"}
            onValueChange={handleStatusFilter}
          >
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
        <DataTable data={tests.data} columns={columns} />
        <Pagination
          meta={tests.meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test</DialogTitle>
            <DialogDescription>
              Fill the form to add a new test
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            autoComplete="off"
          >
            <FieldSet disabled={createForm.formState.isSubmitting}>
              <FieldGroup>
                <Controller
                  name="name"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Test Name</FieldLabel>
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
                      <FieldLabel htmlFor="code">Test Code</FieldLabel>
                      <Input {...field} id="code" />
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
                        {...field}
                        id="price"
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="labId"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="labId">Lab (Optional)</FieldLabel>
                      <AdvancedSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={labOptions}
                        placeholder="Select lab"
                        emptyMessage="No labs found"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="isActive"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="isActive">Status</FieldLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                      >
                        <SelectTrigger id="isActive">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={field.value || ""}
                        id="description"
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
                  Add Test
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
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>Update the test information</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            autoComplete="off"
          >
            <FieldSet disabled={editForm.formState.isSubmitting}>
              <FieldGroup>
                <Controller
                  name="name"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-name">Test Name</FieldLabel>
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
                      <FieldLabel htmlFor="edit-code">Test Code</FieldLabel>
                      <Input {...field} id="edit-code" />
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
                        {...field}
                        id="edit-price"
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="labId"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-labId">
                        Lab (Optional)
                      </FieldLabel>
                      <AdvancedSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={labOptions}
                        placeholder="Select lab"
                        emptyMessage="No labs found"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="isActive"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-isActive">Status</FieldLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                      >
                        <SelectTrigger id="edit-isActive">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={field.value || ""}
                        id="edit-description"
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
                  Update Test
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
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
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
