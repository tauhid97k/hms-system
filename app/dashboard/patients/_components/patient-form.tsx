"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
import { createPatientSchema, updatePatientSchema } from "@/schema/patientSchema";
import type { InferType } from "yup";
import type { Patient } from "@/lib/dataTypes";

type CreatePatientFormData = InferType<typeof createPatientSchema>;
type UpdatePatientFormData = InferType<typeof updatePatientSchema>;

type PatientFormProps =
  | {
      mode: "create";
      patient?: never;
      onSubmit: (data: CreatePatientFormData) => Promise<void>;
      onCancel: () => void;
      isLoading: boolean;
    }
  | {
      mode: "edit";
      patient: Patient;
      onSubmit: (data: UpdatePatientFormData) => Promise<void>;
      onCancel: () => void;
      isLoading: boolean;
    };

export function PatientForm({
  mode,
  patient,
  onSubmit,
  onCancel,
  isLoading,
}: PatientFormProps) {
  const form = useForm<CreatePatientFormData | UpdatePatientFormData>({
    resolver: yupResolver((mode === "create" ? createPatientSchema : updatePatientSchema) as any) as any,
    defaultValues: mode === "create"
      ? {
          name: "",
          age: "" as any,
          phone: "",
          gender: null,
          bloodGroup: null,
          email: "",
          address: "",
          notes: "",
          isActive: true,
        }
      : {
          name: patient?.name || "",
          age: patient?.age || ("" as any),
          phone: patient?.phone || "",
          gender: patient?.gender || null,
          bloodGroup: patient?.bloodGroup || null,
          email: patient?.email || "",
          address: patient?.address || "",
          notes: patient?.notes || "",
          isActive: patient?.isActive ?? true,
        },
  });

  const handleSubmit = async (data: CreatePatientFormData | UpdatePatientFormData) => {
    if (mode === "create") {
      await onSubmit(data as CreatePatientFormData);
      form.reset();
    } else {
      await onSubmit(data as UpdatePatientFormData);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <fieldset disabled={isLoading} className="space-y-6">
        {/* Name */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Full Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input {...field} placeholder="e.g., John Doe" autoFocus />
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
                <FieldLabel>
                  Age <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="e.g., 25"
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : "",
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
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
                <FieldLabel>
                  Phone <span className="text-destructive">*</span>
                </FieldLabel>
                <Input {...field} placeholder="e.g., +1234567890" />
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

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Patient"
              : "Update Patient"}
        </Button>
      </div>
    </form>
  );
}
