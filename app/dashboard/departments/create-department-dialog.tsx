"use client"

import { useState } from "react"
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
import { createDepartmentSchema } from "@/schema/departmentSchema"
import type { InferType } from "yup"

const safeClient = createSafeClient(client)

type CreateDepartmentFormData = {
  name: string
  code: string
  description: string | undefined
  isActive: boolean
}

type CreateDepartmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
}: CreateDepartmentDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: yupResolver(createDepartmentSchema),
    defaultValues: {
      name: "",
      code: "",
      description: undefined,
      isActive: true,
    },
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    const { data: result, error } = await safeClient.departments.create(data)

    if (error) {
      toast.error(error.message || "Failed to create department")
    } else {
      toast.success("Department created successfully")
      form.reset()
      onOpenChange(false)
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>
            Add a new department to the hospital. Click save when you&apos;re done.
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
                  <FieldLabel>
                    Department Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
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
                  <FieldLabel>
                    Department Code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
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
              {isLoading ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
