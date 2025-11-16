"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { AdvancedSelect, AdvancedSelectOption } from "@/components/ui/advanced-select";
import { updateDoctorSchema } from "@/schema/doctorSchema";
import type { InferType } from "yup";
import type { Doctor, Department, Specialization } from "@/lib/dataTypes";

type UpdateDoctorFormData = InferType<typeof updateDoctorSchema>;

type UpdateDoctorFormProps = {
  doctor: Doctor;
  departments: Department[];
  specializations: Specialization[];
  onSubmit: (data: UpdateDoctorFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function UpdateDoctorForm({
  doctor,
  departments,
  specializations,
  onSubmit,
  onCancel,
  isLoading,
}: UpdateDoctorFormProps) {
  const form = useForm({
    resolver: yupResolver(updateDoctorSchema),
    defaultValues: {
      id: doctor.id,
      name: doctor.user?.name,
      email: doctor.user?.email,
      phone: doctor.user?.phone ?? null,
      bio: doctor.bio ?? null,
      qualification: doctor.qualification ?? null,
      consultationFee: doctor.consultationFee ?? undefined,
      hospitalFee: doctor.hospitalFee ?? undefined,
      isAvailable: doctor.isAvailable,
      departmentId: doctor.departmentId ?? null,
      specializationIds:
        doctor.employeeSpecializations?.map((es) => es.specializationId) || [],
      experiences: null,
      certificates: null,
    },
  });

  const handleSubmit = async (data: UpdateDoctorFormData) => {
    await onSubmit(data);
  };

  // Convert departments and specializations to options
  const departmentOptions: AdvancedSelectOption[] = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  const specializationOptions: Option[] = specializations.map((spec) => ({
    value: spec.id,
    label: spec.name,
  }));

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <fieldset disabled={isLoading} className="space-y-6">
        {/* User Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Dr. John Doe"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

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
                    placeholder="doctor@example.com"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  {...field}
                  value={field.value || ""}
                  type="tel"
                  placeholder="+1234567890"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        {/* Professional Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Professional Information</h3>

          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Bio</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Brief professional biography..."
                  rows={3}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="qualification"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Qualification</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="MBBS, MD (Cardiology), Fellowship..."
                  rows={3}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        {/* Department & Specializations (Side by Side) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Department & Specializations</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="departmentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Department</FieldLabel>
                  <AdvancedSelect
                    value={field.value || ""}
                    onChange={field.onChange}
                    options={departmentOptions}
                    placeholder="Select department..."
                    disabled={isLoading}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="specializationIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Specializations</FieldLabel>
                  <MultiSelect
                    value={specializationOptions.filter((opt) =>
                      (field.value || []).includes(opt.value)
                    )}
                    onChange={(selected) =>
                      field.onChange(selected.map((s) => s.value))
                    }
                    options={specializationOptions}
                    placeholder="Select specializations..."
                    isDisabled={isLoading}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </div>

        {/* Fees Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Fee Structure</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="consultationFee"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Consultation Fee</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="hospitalFee"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Hospital Fee</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-4">
          <Controller
            name="isAvailable"
            control={form.control}
            render={({ field }) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel className="!mb-0">
                    Available for appointments
                  </FieldLabel>
                </div>
              </Field>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Doctor"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
