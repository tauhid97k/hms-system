"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppointmentForm } from "../../_components/appointment-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { createAppointmentSchema } from "@/schema/appointmentSchema";
import type { Patient, Doctor } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type CreateAppointmentFormData = InferType<typeof createAppointmentSchema>;

type NewAppointmentFormProps = {
  patients: Patient[];
  doctors: Doctor[];
  currentEmployeeId: string;
};

export function NewAppointmentForm({
  patients,
  doctors,
  currentEmployeeId,
}: NewAppointmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateAppointmentFormData, shouldPrint = false) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.appointments.create(data);

    if (error) {
      toast.error(error.message || "Failed to register appointment");
    } else {
      toast.success(
        `Appointment registered successfully. Serial: ${result.serialNumber}, Queue Position: ${result.queuePosition}`
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

  const handleCancel = () => {
    router.back();
  };

  return (
    <AppointmentForm
      patients={patients}
      doctors={doctors}
      currentEmployeeId={currentEmployeeId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
