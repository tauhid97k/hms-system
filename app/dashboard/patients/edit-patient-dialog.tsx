"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { updatePatientSchema } from "@/schema/patientSchema";
import type { Patient } from "@/lib/dataTypes";
import type { InferType } from "yup";

const safeClient = createSafeClient(client);

type UpdatePatientFormData = InferType<typeof updatePatientSchema>;

type EditPatientDialogProps = {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
}: EditPatientDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdatePatientFormData>({
    resolver: yupResolver(updatePatientSchema) as any,
    defaultValues: {
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      email: patient.email,
      address: patient.address,
      notes: patient.notes,
      isActive: patient.isActive,
    },
  });

  // Reset form when patient changes
  useEffect(() => {
    form.reset({
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      email: patient.email,
      address: patient.address,
      notes: patient.notes,
      isActive: patient.isActive,
    });
  }, [patient, form]);

  const onSubmit = async (data: UpdatePatientFormData) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.patients.update({
      id: patient.id,
      ...data,
    });

    if (error) {
      toast.error(error.message || "Failed to update patient");
    } else {
      toast.success("Patient updated successfully");
      onOpenChange(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogDescription>
            Update patient information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isLoading} className="space-y-4">
            {/* Patient ID Display */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Patient ID:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {patient.patientId}
                </span>
              </p>
            </div>

            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input {...field} value={field.value || ""} placeholder="e.g., John Doe" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Age and Phone Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="age"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Age</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      placeholder="e.g., 25"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone</FieldLabel>
                    <Input {...field} value={field.value || ""} placeholder="e.g., +1234567890" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            {/* Gender and Blood Group Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Gender</FieldLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) =>
                        field.onChange(value === "" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="bloodGroup"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Blood Group</FieldLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) =>
                        field.onChange(value === "" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            {/* Email */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="email"
                    placeholder="e.g., john@example.com"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Address */}
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Address</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Complete address..."
                    rows={2}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Medical Notes</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Any medical history or important notes..."
                    rows={3}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Is Active */}
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isActive"
                    />
                    <FieldLabel htmlFor="isActive" className="!mb-0 cursor-pointer">
                      Active Patient
                    </FieldLabel>
                  </div>
                </Field>
              )}
            />
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
