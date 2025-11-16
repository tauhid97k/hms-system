"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { LuPrinter } from "react-icons/lu";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointmentSchema } from "@/schema/appointmentSchema";
import type { InferType } from "yup";
import type { Patient, Doctor } from "@/lib/dataTypes";

type CreateAppointmentFormData = InferType<typeof createAppointmentSchema>;

type AppointmentFormProps = {
  patients: Patient[];
  doctors: Doctor[];
  currentEmployeeId: string;
  onSubmit: (data: CreateAppointmentFormData, shouldPrint?: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function AppointmentForm({
  patients,
  doctors,
  currentEmployeeId,
  onSubmit,
  onCancel,
  isLoading,
}: AppointmentFormProps) {
  const form = useForm<CreateAppointmentFormData>({
    resolver: yupResolver(createAppointmentSchema) as any,
    defaultValues: {
      patientId: "",
      doctorId: "",
      assignedBy: currentEmployeeId,
      appointmentType: "NEW",
      chiefComplaint: "",
    },
  });

  const handleSubmit = async (data: CreateAppointmentFormData, shouldPrint = false) => {
    await onSubmit(data, shouldPrint);
    form.reset({
      patientId: "",
      doctorId: "",
      assignedBy: currentEmployeeId,
      appointmentType: "NEW",
      chiefComplaint: "",
    });
  };

  // Filter only available doctors
  const availableDoctors = doctors.filter((doctor) => doctor.isAvailable);

  return (
    <form onSubmit={form.handleSubmit((data) => handleSubmit(data, false))} className="space-y-6">
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
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.patientId}) - {patient.age}y, {patient.gender || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No available doctors
                    </div>
                  ) : (
                    availableDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user?.name || "Unknown"}
                        {doctor.department && (
                          <span className="text-muted-foreground">
                            {" "}
                            - {doctor.department.name}
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
                  <SelectItem value="FOLLOWUP">Follow-up Appointment</SelectItem>
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
