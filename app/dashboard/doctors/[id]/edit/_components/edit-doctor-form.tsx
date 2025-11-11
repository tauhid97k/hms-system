"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoctorForm } from "../../../_components/doctor-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { InferType } from "yup";
import { updateDoctorSchema } from "@/schema/doctorSchema";
import type { Doctor, Department, Specialization } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type UpdateDoctorFormData = InferType<typeof updateDoctorSchema>;

type EditDoctorFormProps = {
  doctor: Doctor;
  departments: Department[];
  specializations: Specialization[];
};

export function EditDoctorForm({ doctor, departments, specializations }: EditDoctorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    const { error } = await safeClient.doctors.update(data);

    if (error) {
      toast.error(error.message || "Failed to update doctor");
      setIsLoading(false);
    } else {
      toast.success("Doctor updated successfully");
      // Redirect to doctors list and refresh to show updated data
      router.push("/dashboard/doctors");
      router.refresh();
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <DoctorForm
      mode="edit"
      doctor={doctor}
      departments={departments}
      specializations={specializations}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
