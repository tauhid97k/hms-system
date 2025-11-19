"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { updateSpecializationSchema } from "@/schema/specializationSchema";
import type { InferType } from "yup";
import type { Specialization } from "@/lib/dataTypes";

const safeClient = createSafeClient(client);

type UpdateSpecializationFormData = InferType<typeof updateSpecializationSchema>;

type EditSpecializationDialogProps = {
  specialization: Specialization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditSpecializationDialog({
  specialization,
  open,
  onOpenChange,
}: EditSpecializationDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateSpecializationFormData>({
    resolver: yupResolver(updateSpecializationSchema),
    defaultValues: {
      name: specialization.name,
      code: specialization.code,
      description: specialization.description || "",
      isActive: specialization.isActive,
    },
  });

  const onSubmit = async (data: UpdateSpecializationFormData) => {
    setIsLoading(true);
    const { error } = await safeClient.specializations.update({
      id: specialization.id,
      ...data,
    });

    if (error) {
      toast.error(error.message || "Failed to update specialization");
    } else {
      toast.success("Specialization updated successfully");
      onOpenChange(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Specialization</DialogTitle>
          <DialogDescription>
            Update specialization information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isLoading} className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} placeholder="e.g., Cardiology" autoFocus />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} placeholder="e.g., CARDIO" className="uppercase" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Brief description of this specialization..."
                    rows={3}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isActive"
                    />
                    <FieldLabel htmlFor="isActive" className="!mb-0 cursor-pointer">
                      Active
                    </FieldLabel>
                  </div>
                </Field>
              )}
            />
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Specialization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
