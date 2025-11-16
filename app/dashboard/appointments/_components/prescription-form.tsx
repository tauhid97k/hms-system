"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedSelect, AdvancedSelectOption } from "@/components/ui/advanced-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-format";
import type { Medicine, MedicineInstruction } from "@/lib/dataTypes";
import { createPrescriptionSchema } from "@/schema/prescriptionSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { LuCalendar, LuPlus, LuTrash2 } from "react-icons/lu";
import type { InferType } from "yup";

type CreatePrescriptionData = InferType<typeof createPrescriptionSchema>;

type PrescriptionFormProps = {
  appointmentId: string;
  doctorId: string;
  medicines: Medicine[];
  instructions: MedicineInstruction[];
  onSubmit: (data: CreatePrescriptionData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function PrescriptionForm({
  appointmentId,
  doctorId,
  medicines,
  instructions,
  onSubmit,
  onCancel,
  isLoading,
}: PrescriptionFormProps) {
  const form = useForm({
    resolver: yupResolver(createPrescriptionSchema),
    defaultValues: {
      appointmentId,
      doctorId,
      notes: null,
      followUpDate: null,
      items: [
        {
          medicineId: "",
          instructionId: null,
          duration: null,
          notes: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = async (data: CreatePrescriptionData) => {
    await onSubmit(data);
  };

  // Convert medicines to options
  const medicineOptions: AdvancedSelectOption[] = medicines.map((medicine) => ({
    value: medicine.id,
    label: `${medicine.name}${medicine.strength ? ` (${medicine.strength})` : ""}${medicine.genericName ? ` - ${medicine.genericName}` : ""}`,
  }));

  // Convert instructions to options
  const instructionOptions = instructions.map((instruction) => ({
    value: instruction.id,
    label: instruction.name,
  }));

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Medicines Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Medicines</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                medicineId: "",
                instructionId: null,
                duration: null,
                notes: null,
              })
            }
            disabled={isLoading}
            className="gap-2"
          >
            <LuPlus className="size-4" />
            Add Medicine
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border bg-muted/30 p-4 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Medicine {index + 1}
                </h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={isLoading}
                    className="size-8 p-0 text-destructive hover:text-destructive"
                  >
                    <LuTrash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Medicine Selection */}
                <Controller
                  name={`items.${index}.medicineId`}
                  control={form.control}
                  render={({ field: controllerField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel>
                        Medicine <span className="text-destructive">*</span>
                      </FieldLabel>
                      <AdvancedSelect
                        value={controllerField.value || ""}
                        onChange={controllerField.onChange}
                        options={medicineOptions}
                        placeholder="Search and select medicine"
                        disabled={isLoading}
                        emptyMessage="No medicines found"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {/* Instruction */}
                <Controller
                  name={`items.${index}.instructionId`}
                  control={form.control}
                  render={({ field: controllerField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Dosage Instructions</FieldLabel>
                      <Select
                        value={controllerField.value || ""}
                        onValueChange={controllerField.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select instruction" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {/* Duration */}
                <Controller
                  name={`items.${index}.duration`}
                  control={form.control}
                  render={({ field: controllerField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Duration</FieldLabel>
                      <Input
                        {...controllerField}
                        value={controllerField.value || ""}
                        placeholder="e.g., 7 days, 2 weeks"
                        disabled={isLoading}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {/* Item Notes */}
                <Controller
                  name={`items.${index}.notes`}
                  control={form.control}
                  render={({ field: controllerField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel>Additional Notes</FieldLabel>
                      <Textarea
                        {...controllerField}
                        value={controllerField.value || ""}
                        placeholder="Any special instructions for this medicine..."
                        rows={2}
                        disabled={isLoading}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Notes */}
      <Controller
        name="notes"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>General Notes & Advice</FieldLabel>
            <Textarea
              {...field}
              value={field.value || ""}
              placeholder="Diagnosis, general advice, precautions, lifestyle recommendations..."
              rows={5}
              disabled={isLoading}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Follow-up Date */}
      <Controller
        name="followUpDate"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Follow-up Date (Optional)</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                  disabled={isLoading}
                >
                  <LuCalendar className="mr-2 size-4" />
                  {field.value ? formatDate(field.value) : "Select follow-up date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date || null)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating Prescription..." : "Create Prescription"}
        </Button>
      </div>
    </form>
  );
}
