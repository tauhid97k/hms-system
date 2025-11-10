"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { createDoctorSchema, updateDoctorSchema } from "@/schema/doctorSchema";
import type { InferType } from "yup";
import type { Doctor, Department, Specialization } from "@/lib/dataTypes";

type CreateDoctorFormData = InferType<typeof createDoctorSchema>;
type UpdateDoctorFormData = InferType<typeof updateDoctorSchema>;

type DoctorFormProps = {
  mode: "create" | "edit";
  doctor?: Doctor;
  departments: Department[];
  specializations: Specialization[];
  onSubmit: (data: CreateDoctorFormData | UpdateDoctorFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function DoctorForm({
  mode,
  doctor,
  departments,
  specializations,
  onSubmit,
  onCancel,
  isLoading,
}: DoctorFormProps) {
  const form = useForm<CreateDoctorFormData | UpdateDoctorFormData>({
    resolver: yupResolver(
      mode === "create" ? createDoctorSchema : updateDoctorSchema,
    ),
    defaultValues:
      mode === "create"
        ? {
            name: "",
            email: "",
            password: "",
            phone: "",
            bio: "",
            qualification: "",
            consultationFee: "" as any,
            hospitalFee: 0,
            isAvailable: true,
            departmentIds: [],
            specializationIds: [],
          }
        : {
            id: doctor?.id || "",
            name: doctor?.user?.name || "",
            email: doctor?.user?.email || "",
            phone: doctor?.user?.phone || "",
            bio: doctor?.bio || "",
            qualification: doctor?.qualification || "",
            consultationFee: doctor?.consultationFee || ("" as any),
            hospitalFee: doctor?.hospitalFee || 0,
            isAvailable: doctor?.isAvailable ?? true,
            departmentIds:
              doctor?.employeeDepartments?.map((ed) => ed.departmentId) || [],
            specializationIds:
              doctor?.employeeSpecializations?.map((es) => es.specializationId) ||
              [],
          },
  });

  const handleSubmit = async (
    data: CreateDoctorFormData | UpdateDoctorFormData,
  ) => {
    await onSubmit(data);
    if (mode === "create") {
      form.reset();
    }
  };

  // Convert departments and specializations to options
  const departmentOptions: Option[] = departments.map((dept) => ({
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
                  <FieldLabel>
                    Full Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} value={field.value || ""} placeholder="Dr. John Doe" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Email <span className="text-destructive">*</span>
                  </FieldLabel>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {mode === "create" && (
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Password <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="password"
                      placeholder="Minimum 8 characters"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}

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
                    placeholder="+1 234 567 8900"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </div>

        {/* Professional Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Professional Details</h3>

          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Biography</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Brief professional biography..."
                  rows={5}
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
                <FieldLabel>Qualifications</FieldLabel>
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

        {/* Departments & Specializations (Side by Side) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Departments & Specializations</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="departmentIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Departments</FieldLabel>
                  <MultiSelect
                    value={departmentOptions.filter((opt) =>
                      (field.value as string[])?.includes(opt.value)
                    )}
                    onChange={(selected) =>
                      field.onChange((selected as Option[]).map((s) => s.value))
                    }
                    options={departmentOptions}
                    placeholder="Select departments..."
                    isDisabled={isLoading}
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
                      (field.value as string[])?.includes(opt.value)
                    )}
                    onChange={(selected) =>
                      field.onChange((selected as Option[]).map((s) => s.value))
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
                  <FieldLabel>
                    Consultation Fee ($) <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50.00"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : "",
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
              name="hospitalFee"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Hospital Fee ($)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.00"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : 0,
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
          </div>
        </div>

        {/* Availability */}
        <Controller
          name="isAvailable"
          control={form.control}
          render={({ field }) => (
            <Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isAvailable"
                />
                <FieldLabel htmlFor="isAvailable" className="!mb-0 cursor-pointer">
                  Available for Consultation
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
              ? "Create Doctor"
              : "Update Doctor"}
        </Button>
      </div>
    </form>
  );
}
