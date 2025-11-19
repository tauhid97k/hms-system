"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Doctor, Patient } from "@/lib/dataTypes";
import {
  createAppointmentSchema,
  createAppointmentWithNewPatientSchema,
} from "@/schema/appointmentSchema";
import type { InferType } from "yup";
import { AppointmentForm } from "./appointment-form";
import { NewPatientAppointmentForm } from "./new-patient-appointment-form";

type AppointmentFormData = InferType<typeof createAppointmentSchema>;
type NewPatientAppointmentFormData = InferType<
  typeof createAppointmentWithNewPatientSchema
>;

type AppointmentFormTabsProps = {
  patients: Patient[];
  doctors: Doctor[];
  onSubmitExisting: (
    data: AppointmentFormData,
    shouldPrint?: boolean,
  ) => Promise<void>;
  onSubmitNew: (data: NewPatientAppointmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function AppointmentFormTabs({
  patients,
  doctors,
  onSubmitExisting,
  onSubmitNew,
  onCancel,
  isLoading,
}: AppointmentFormTabsProps) {
  return (
    <Tabs defaultValue="new" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="new">New Patient</TabsTrigger>
        <TabsTrigger value="existing">Existing Patient</TabsTrigger>
      </TabsList>

      <TabsContent value="new">
        <div className="rounded-xl border bg-card p-6">
          <NewPatientAppointmentForm
            doctors={doctors}
            onSubmit={onSubmitNew}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        </div>
      </TabsContent>

      <TabsContent value="existing">
        <div className="rounded-xl border bg-card p-6">
          <AppointmentForm
            patients={patients}
            doctors={doctors}
            onSubmit={onSubmitExisting}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
