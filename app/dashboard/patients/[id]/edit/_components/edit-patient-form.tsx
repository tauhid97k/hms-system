"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientForm } from "../../../_components/patient-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { updatePatientSchema } from "@/schema/patientSchema";
import type { Patient } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type UpdatePatientFormData = InferType<typeof updatePatientSchema>;

type EditPatientFormProps = {
  patient: Patient;
};

export function EditPatientForm({ patient }: EditPatientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdatePatientFormData) => {
    setIsLoading(true);
    const { error } = await safeClient.patients.update({
      id: patient.id,
      ...data,
    });

    if (error) {
      toast.error(error.message || "Failed to update patient");
    } else {
      toast.success("Patient updated successfully");
      router.back();
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PatientForm
      mode="edit"
      patient={patient}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
