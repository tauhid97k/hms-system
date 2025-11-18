"use client";

import { PrescriptionForm } from "./prescription-form";
import { PrescriptionPatientCard } from "./prescription-patient-card";
import type {
  AppointmentForPrescription,
  Medicine,
  MedicineInstruction,
  TestType,
} from "@/lib/dataTypes";
import { client } from "@/lib/orpc";
import { createPrescriptionSchema } from "@/schema/prescriptionSchema";
import { createSafeClient } from "@orpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { InferType } from "yup";

const safeClient = createSafeClient(client);

type CreatePrescriptionData = InferType<typeof createPrescriptionSchema>;

type NewPrescriptionFormProps = {
  appointment: AppointmentForPrescription;
  medicines: Medicine[];
  instructions: MedicineInstruction[];
  testTypes: TestType[];
};

export function NewPrescriptionForm({
  appointment,
  medicines,
  instructions,
  testTypes,
}: NewPrescriptionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreatePrescriptionData) => {
    setIsLoading(true);
    const { error } = await safeClient.prescriptions.create(data);

    if (error) {
      toast.error(error.message || "Failed to create prescription");
      setIsLoading(false);
    } else {
      toast.success("Prescription created successfully");
      router.push(`/dashboard/appointments`);
      router.refresh();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Extract doctorId from appointment
  const doctorId = appointment.doctor.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Create Prescription</h1>
        <p className="text-sm text-muted-foreground">
          Add medicines and instructions for the patient
        </p>
      </div>

      <div className="space-y-6 rounded-xl border bg-card p-6">
        {/* Patient Info Card */}
        <PrescriptionPatientCard appointment={appointment} />

        {/* Prescription Form */}
        <PrescriptionForm
          appointmentId={appointment.id}
          doctorId={doctorId}
          medicines={medicines}
          instructions={instructions}
          testTypes={testTypes}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
