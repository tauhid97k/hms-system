"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc";
import { createSpecializationSchema } from "@/schema/specializationSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { createSafeClient } from "@orpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { InferType } from "yup";

const safeClient = createSafeClient(client);

type CreateSpecializationFormData = InferType<
  typeof createSpecializationSchema
>;

type CreateSpecializationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateSpecializationDialog({
  open,
  onOpenChange,
}: CreateSpecializationDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateSpecializationFormData>({
    resolver: yupResolver(createSpecializationSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateSpecializationFormData) => {
    setIsLoading(true);
    const { error } = await safeClient.specializations.create(data);

    if (error) {
      toast.error(error.message || "Failed to create specialization");
    } else {
      toast.success("Specialization created successfully");
      form.reset();
      onOpenChange(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Specialization</DialogTitle>
          <DialogDescription>
            Add a new medical specialization.
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
                  <Input
                    {...field}
                    placeholder="e.g., CARDIO"
                    className="uppercase"
                  />
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
                    <FieldLabel
                      htmlFor="isActive"
                      className="!mb-0 cursor-pointer"
                    >
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
              {isLoading ? "Creating..." : "Create Specialization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
