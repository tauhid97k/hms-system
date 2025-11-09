"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { client } from "@/lib/orpc"
import { createSafeClient } from "@orpc/client"
import { updateDepartmentSchema } from "@/schema/departmentSchema"
import type { Department } from "@/lib/dataTypes"
import type { InferType } from "yup"

const safeClient = createSafeClient(client)

type UpdateDepartmentFormData = InferType<typeof updateDepartmentSchema>

type EditDepartmentDialogProps = {
  department: Department
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
}: EditDepartmentDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UpdateDepartmentFormData>({
    resolver: yupResolver(updateDepartmentSchema),
    defaultValues: {
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    },
  })

  // Reset form when department changes
  useEffect(() => {
    form.reset({
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    })
  }, [department, form])

  const onSubmit = async (data: UpdateDepartmentFormData) => {
    setIsLoading(true)
    const { data: result, error } = await safeClient.departments.update({
      id: department.id,
      ...data,
    })

    if (error) {
      toast.error(error.message || "Failed to update department")
    } else {
      toast.success("Department updated successfully")
      onOpenChange(false)
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Make changes to the department. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isLoading} className="space-y-4">
            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Department Name</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., Cardiology"
                    autoFocus
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Code */}
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Department Code</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., CARD"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Brief description of the department..."
                    rows={3}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Is Active */}
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
                      Active Department
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
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
