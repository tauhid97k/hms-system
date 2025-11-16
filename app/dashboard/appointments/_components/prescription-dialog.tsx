"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrescriptionPatientCard } from "./prescription-patient-card";
import { PrescriptionForm } from "./prescription-form";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { toast } from "sonner";
import type { AppointmentForPrescription, Medicine, MedicineInstruction } from "@/lib/dataTypes";
import type { InferType } from "yup";
import { createPrescriptionSchema } from "@/schema/prescriptionSchema";

const safeClient = createSafeClient(client);

type CreatePrescriptionData = InferType<typeof createPrescriptionSchema>;

type PrescriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentForPrescription;
  doctorId: string;
  medicines: Medicine[];
  instructions: MedicineInstruction[];
  onViewHistory?: () => void;
};

export function PrescriptionDialog({
  open,
  onOpenChange,
  appointment,
  doctorId,
  medicines,
  instructions,
  onViewHistory,
}: PrescriptionDialogProps) {
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
      router.refresh();
      onOpenChange(false);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
          <DialogDescription>
            Add medicines and instructions for the patient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info Card */}
          <PrescriptionPatientCard
            appointment={appointment}
            onViewHistory={onViewHistory}
          />

          {/* Prescription Form */}
          <PrescriptionForm
            appointmentId={appointment.id}
            doctorId={doctorId}
            medicines={medicines}
            instructions={instructions}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
