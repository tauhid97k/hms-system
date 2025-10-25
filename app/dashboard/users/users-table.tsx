"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { User } from "@/lib/dataTypes";
import { userSchema, UserSchemaType } from "@/schema/userSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const users = {
  data: [
    {
      id: 1,
      name: "John Doe",
      username: "john",
      email: "john@example.com",
      role: "user",
    },
    {
      id: 2,
      name: "Jane Doe",
      username: "jane",
      email: "jane@example.com",
      role: "user",
    },
  ],
  meta: {
    links: [],
    current_page: 1,
    last_page: 1,
    total: 2,
  },
};

const UsersTable = () => {
  const [openUserForm, setOpenUserForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  // User form
  const form = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "",
    },
  });

  // Handle Form Submit
  const onSubmit = (data: UserSchemaType) => {
    console.log(data);
  };

  // Handle Page Change
  const handlePageChange = (page: string) => {
    params.set("page", page);
    router.push(`?${params}`, { scroll: false });
  };

  // Table Columns
  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Username",
      accessorKey: "username",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "role",
    },
    {
      header: "Action",
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Users</h1>
        <Button onClick={() => setOpenUserForm(true)}>Add User</Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4 pb-6">
          <Input type="search" placeholder="Search..." className="max-w-xs" />
        </div>
        <DataTable data={users.data} columns={columns} />
        <Pagination meta={users.meta} onPageChange={handlePageChange} />
      </div>

      {/* User creation dialog */}
      <Dialog open={openUserForm} onOpenChange={setOpenUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Fill the form to add a new user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Full Name</FieldLabel>
                      <Input {...field} id="name" placeholder="John Doe" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <Input {...field} id="username" placeholder="john" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        placeholder="john@example.com"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input {...field} id="password" placeholder="password" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="role">Role</FieldLabel>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setOpenUserForm(false)}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit">Add User</Button>
              </div>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersTable;
