"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisitForm } from "../../_components/visit-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { createVisitSchema } from "@/schema/visitSchema";
import type { Patient, Doctor } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type CreateVisitFormData = InferType<typeof createVisitSchema>;

type NewVisitFormProps = {
  patients: Patient[];
  doctors: Doctor[];
  currentEmployeeId: string;
};

export function NewVisitForm({
  patients,
  doctors,
  currentEmployeeId,
}: NewVisitFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateVisitFormData, shouldPrint = false) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.visits.create(data);

    if (error) {
      toast.error(error.message || "Failed to register visit");
    } else {
      toast.success(
        `Visit registered successfully. Serial: ${result.serialNumber}, Queue Position: ${result.queuePosition}`
      );

      if (shouldPrint) {
        // TODO: Implement print receipt functionality
        toast.info("Print receipt functionality will be implemented soon");
      }

      router.push("/dashboard/visits");
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <VisitForm
      patients={patients}
      doctors={doctors}
      currentEmployeeId={currentEmployeeId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
