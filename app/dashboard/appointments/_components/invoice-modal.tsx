"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import type {
  BillWithDetails,
  PaymentMethod,
} from "@/lib/dataTypes";
import { client } from "@/lib/orpc";
import { yupResolver } from "@hookform/resolvers/yup";
import { createSafeClient } from "@orpc/client";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuCheck } from "react-icons/lu";
import { toast } from "sonner";
import { object, string } from "yup";

const safeClient = createSafeClient(client);

// Payment schema
const paymentSchema = object({
  paymentMethod: string().required("Payment method is required"),
});

type PaymentFormData = {
  paymentMethod: string;
};

type InvoiceModalProps = {
  appointmentId: string;
  paymentMethods: PaymentMethod[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceModal({
  appointmentId,
  paymentMethods,
  open,
  onOpenChange,
}: InvoiceModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [billData, setBillData] = useState<BillWithDetails | null>(null);

  // Payment form with react-hook-form
  const paymentForm = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "Cash",
    },
  });

  const handleOpen = async () => {
    if (!appointmentId) return;

    setIsLoading(true);
    try {
      // Fetch appointment bills to get bill ID
      const { data: bills, error: billsError } =
        await safeClient.appointments.getBills(appointmentId);

      if (billsError || !bills || bills.length === 0) {
        toast.error("No bill found for this appointment");
        handleClose();
        return;
      }

      const billId = bills[0].id;
      const { data: bill, error: billError } =
        await safeClient.bills.getWithPayments({ id: billId });

      if (billError || !bill) {
        toast.error("Failed to load invoice data");
        handleClose();
        return;
      }

      setBillData(bill as BillWithDetails);
    } catch {
      toast.error("Failed to load invoice data");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBillData(null);
    paymentForm.reset();
    onOpenChange(false);
  };

  // Fetch data when modal opens
  if (open && !billData && !isLoading && appointmentId) {
    handleOpen();
  }

  // Handle payment form submission
  const onSubmitPayment = async (data: PaymentFormData) => {
    if (!billData) return;

    const { error } = await safeClient.payments.create({
      billId: billData.id,
      amount: billData.dueAmount,
      paymentMethod: data.paymentMethod,
    });

    if (error) {
      toast.error(error.message || "Failed to process payment");
    } else {
      toast.success("Payment confirmed successfully!");
      handleClose();
      router.refresh();
    }
  };

  const isPaid = billData?.status === "PAID";
  const hasDue = (billData?.dueAmount ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Invoice</span>
            {billData && (
              <Badge variant="secondary" className="text-sm font-normal">
                #{billData.billNumber}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : !billData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive-foreground">
              No invoice data available
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bill Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Bill Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Patient:</span>
                  <div className="font-medium">
                    {billData.patient.name} ({billData.patient.patientId})
                  </div>
                </div>
                {billData.appointment && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Doctor:</span>
                      <div className="font-medium">
                        {billData.appointment.doctor.user.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <div className="font-medium">
                        {format(
                          new Date(billData.appointment.appointmentDate),
                          "PPP",
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Serial / Queue:
                      </span>
                      <div className="font-medium">
                        #{billData.appointment.serialNumber} /{" "}
                        {billData.appointment.queuePosition}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bill Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Bill Details</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant={
                      billData.status === "PAID"
                        ? "success"
                        : billData.status === "PARTIAL"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {billData.status}
                  </Badge>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.billItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.itemName}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">
                          ৳{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          ৳{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/50">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-semibold">
                        Total
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ৳{billData.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={3} className="p-3 text-right">
                        Paid
                      </td>
                      <td className="p-3 text-right text-green-600">
                        ৳{billData.paidAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={3} className="p-3 text-right font-semibold">
                        Due
                      </td>
                      <td className="p-3 text-right font-semibold text-destructive">
                        ৳{billData.dueAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Paid Status Display */}
            {isPaid && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="success" className="text-base">
                      PAID
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Payment Completed
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Total Paid
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{billData.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Form and Actions (only show if there's due amount) */}
            {hasDue && (
              <form
                onSubmit={paymentForm.handleSubmit(onSubmitPayment)}
                className="space-y-4"
              >
                <FieldSet disabled={paymentForm.formState.isSubmitting}>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Confirm Payment</h3>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Amount to Pay:
                        </span>
                        <span className="text-lg font-bold">
                          ৳{billData.dueAmount.toFixed(2)}
                        </span>
                      </div>
                      <FieldGroup>
                        <Controller
                          name="paymentMethod"
                          control={paymentForm.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="paymentMethod">
                                Payment Method{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentMethods.map((method) => (
                                    <SelectItem
                                      key={method.id}
                                      value={method.name}
                                    >
                                      {method.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError errors={[fieldState.error]} />
                            </Field>
                          )}
                        />
                      </FieldGroup>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      isLoading={paymentForm.formState.isSubmitting}
                    >
                      <LuCheck />
                      <span>Confirm Payment</span>
                    </Button>
                  </div>
                </FieldSet>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
