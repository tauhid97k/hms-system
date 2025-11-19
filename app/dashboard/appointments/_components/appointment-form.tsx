"use client";

import {
  AdvancedSelect,
  AdvancedSelectOption,
} from "@/components/ui/advanced-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Doctor, Patient } from "@/lib/dataTypes";
import { createAppointmentSchema } from "@/schema/appointmentSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { LuPrinter } from "react-icons/lu";
import type { InferType } from "yup";

type CreateAppointmentFormData = InferType<typeof createAppointmentSchema>;

type AppointmentFormProps = {
  patients: Patient[];
  doctors: Doctor[];
  onSubmit: (
    data: CreateAppointmentFormData,
    shouldPrint?: boolean,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function AppointmentForm({
  patients,
  doctors,
  onSubmit,
  onCancel,
  isLoading,
}: AppointmentFormProps) {
  const form = useForm<CreateAppointmentFormData>({
    resolver: yupResolver(createAppointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentType: "NEW",
      chiefComplaint: null,
    },
  });

  const handleSubmit = async (
    data: CreateAppointmentFormData,
    shouldPrint = false,
  ) => {
    await onSubmit(data, shouldPrint);
    form.reset({
      patientId: "",
      doctorId: "",
      appointmentType: "NEW",
      chiefComplaint: null,
    });
  };

  // Filter only available doctors
  const availableDoctors = doctors.filter((doctor) => doctor.isAvailable);

  // Convert patients to AdvancedSelect options
  const patientOptions: AdvancedSelectOption[] = patients.map((patient) => ({
    value: patient.id,
    label: `${patient.name} (${patient.patientId})`,
    description: `${patient.age}y, ${patient.gender || "N/A"}`,
  }));

  // Convert doctors to AdvancedSelect options
  const doctorOptions: AdvancedSelectOption[] = availableDoctors.map(
    (doctor) => {
      const department = doctor.department?.name || "No department";
      const specializations = doctor.employeeSpecializations
        ?.map((es) => es.specialization.name)
        .join(", ");

      const description = specializations
        ? `${department} • ${specializations}`
        : department;

      return {
        value: doctor.id,
        label: doctor.user?.name || "Unknown",
        description,
      };
    },
  );

  return (
    <form
      onSubmit={form.handleSubmit((data) => handleSubmit(data, false))}
      className="space-y-6"
    >
      <fieldset disabled={isLoading} className="space-y-6">
        {/* Patient Selection */}
        <Controller
          name="patientId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Patient <span className="text-destructive">*</span>
              </FieldLabel>
              <AdvancedSelect
                options={patientOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search and select patient..."
                emptyMessage="No patients found"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* Doctor Selection */}
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
                value={field.value}
                onChange={field.onChange}
                placeholder="Search and select doctor..."
                emptyMessage="No available doctors"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* Appointment Type */}
        <Controller
          name="appointmentType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Appointment Type <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New Appointment</SelectItem>
                  <SelectItem value="FOLLOWUP">
                    Follow-up Appointment
                  </SelectItem>
                </SelectContent>
              </Select>
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
              <FieldLabel>Appointment Reason</FieldLabel>
              <Textarea
                {...field}
                value={field.value || ""}
                placeholder="Patient's main reason for appointment..."
                rows={4}
              />
              <FieldError errors={[fieldState.error]} />
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
        <Button
          type="button"
          variant="outline"
          onClick={form.handleSubmit((data) => handleSubmit(data, true))}
          disabled={isLoading}
        >
          <LuPrinter />
          Register & Print
        </Button>
        <Button type="submit" disabled={isLoading} isLoading={isLoading}>
          Register Appointment
        </Button>
      </div>
    </form>
  );
}
