"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoctorForm } from "../../_components/doctor-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { createDoctorSchema } from "@/schema/doctorSchema";
import type { Department, Specialization } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type CreateDoctorFormData = InferType<typeof createDoctorSchema>;

type NewDoctorFormProps = {
  departments: Department[];
  specializations: Specialization[];
};

export function NewDoctorForm({ departments, specializations }: NewDoctorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    const { data: result, error } = await safeClient.doctors.create(data);

    if (error) {
      toast.error(error.message || "Failed to create doctor");
    } else {
      toast.success("Doctor created successfully");
      router.refresh();
      // Form will be reset by the DoctorForm component
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <DoctorForm
      mode="create"
      departments={departments}
      specializations={specializations}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
