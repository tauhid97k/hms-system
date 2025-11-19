"use client";

import type { Doctor, Patient } from "@/lib/dataTypes";
import { client } from "@/lib/orpc";
import {
  createAppointmentSchema,
  createAppointmentWithNewPatientSchema,
} from "@/schema/appointmentSchema";
import { createSafeClient } from "@orpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { InferType } from "yup";
import { AppointmentFormTabs } from "./appointment-form-tabs";

const safeClient = createSafeClient(client);

type CreateAppointmentFormData = InferType<typeof createAppointmentSchema>;
type CreateAppointmentWithNewPatientFormData = InferType<
  typeof createAppointmentWithNewPatientSchema
>;

type NewAppointmentFormProps = {
  patients: Patient[];
  doctors: Doctor[];
};

export function NewAppointmentForm({
  patients,
  doctors,
}: NewAppointmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitExisting = async (
    data: CreateAppointmentFormData,
    shouldPrint = false,
  ) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.appointments.create(data);

    if (error) {
      toast.error(error.message || "Failed to register appointment");
    } else {
      toast.success(
        `Appointment registered successfully. Serial: ${result.appointment.serialNumber}, Queue Position: ${result.appointment.queuePosition}`,
      );

      if (shouldPrint) {
        // TODO: Implement print receipt functionality
        toast.info("Print receipt functionality will be implemented soon");
      }

      router.push("/dashboard/appointments");
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleSubmitNew = async (
    data: CreateAppointmentWithNewPatientFormData,
  ) => {
    setIsLoading(true);
    const { data: result, error } =
      await safeClient.appointments.createWithNewPatient(data);

    if (error) {
      toast.error(error.message || "Failed to register appointment");
    } else {
      toast.success(
        `Patient registered with ID: ${result.patientId}. Appointment Serial: ${result.appointment.serialNumber}, Queue Position: ${result.appointment.queuePosition}`,
      );

      router.push("/dashboard/appointments");
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AppointmentFormTabs
      patients={patients}
      doctors={doctors}
      onSubmitExisting={handleSubmitExisting}
      onSubmitNew={handleSubmitNew}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
