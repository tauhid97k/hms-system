"use client";

import type { AdvancedSelectOption } from "@/components/ui/advanced-select";
import { AdvancedSelect } from "@/components/ui/advanced-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Doctor } from "@/lib/dataTypes";
import { createAppointmentWithNewPatientSchema } from "@/schema/appointmentSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import type { InferType } from "yup";

type NewPatientAppointmentFormData = InferType<
  typeof createAppointmentWithNewPatientSchema
>;

type NewPatientAppointmentFormProps = {
  doctors: Doctor[];
  onSubmit: (data: NewPatientAppointmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function NewPatientAppointmentForm({
  doctors,
  onSubmit,
  onCancel,
  isLoading,
}: NewPatientAppointmentFormProps) {
  const form = useForm({
    resolver: yupResolver(createAppointmentWithNewPatientSchema),
    defaultValues: {
      patientName: "",
      patientPhone: "",
      patientAge: 0,
      patientGender: "MALE",
      doctorId: "",
      appointmentType: "NEW" as const,
      chiefComplaint: null,
    },
  });

  const handleSubmit = async (data: NewPatientAppointmentFormData) => {
    await onSubmit(data);
    form.reset();
  };

  // Convert doctors to options with department and specializations
  const doctorOptions: AdvancedSelectOption[] = doctors.map((doctor) => {
    const specializationNames =
      doctor.employeeSpecializations
        ?.map((es) => es.specialization?.name)
        .filter(Boolean) || [];

    const description = [
      doctor.department?.name,
      ...(specializationNames.length > 0
        ? [`${specializationNames.join(", ")}`]
        : []),
    ]
      .filter(Boolean)
      .join(" • ");

    return {
      value: doctor.id,
      label: doctor.user?.name || "Unknown",
      description,
    };
  });

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <fieldset disabled={isLoading} className="space-y-6">
        {/* New Patient Section */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Patient Name */}
          <Controller
            name="patientName"
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

          {/* Patient Phone */}
          <Controller
            name="patientPhone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Phone Number <span className="text-destructive">*</span>
                </FieldLabel>
                <Input {...field} placeholder="e.g., +1234567890" />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Patient Age */}
          <Controller
            name="patientAge"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Age <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g., 25"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Patient Gender */}
          <Controller
            name="patientGender"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Gender <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
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
        </div>

        {/* Doctor */}
        <Controller
          name="doctorId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Doctor <span className="text-destructive">*</span>
              </FieldLabel>
              <AdvancedSelect
                options={doctorOptions}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select a doctor"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* Appointment Reason */}
        <Controller
          name="chiefComplaint"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Appointment Reason (Optional)</FieldLabel>
              <Textarea
                {...field}
                value={field.value || ""}
                placeholder="Patient's main reason for appointment..."
                rows={3}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Appointment
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
