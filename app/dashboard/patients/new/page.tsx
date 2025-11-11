"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientForm } from "../_components/patient-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { createPatientSchema } from "@/schema/patientSchema";

const safeClient = createSafeClient(client);

type CreatePatientFormData = InferType<typeof createPatientSchema>;

export default function NewPatientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.patients.create(data);

    if (error) {
      toast.error(error.message || "Failed to create patient");
    } else {
      toast.success(`Patient created successfully with ID: ${result.patientId}`);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Register New Patient</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the patient information. Required fields are marked with *.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <PatientForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
