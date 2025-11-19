"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { client } from "@/lib/orpc";
import { createSafeClient } from "@orpc/client";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuCheck, LuPrinter } from "react-icons/lu";
import { toast } from "sonner";

const safeClient = createSafeClient(client);

type PaymentMethod = {
  id: string;
  name: string;
  isActive: boolean;
};

type BillItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Payment = {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date | string;
  receivedByEmployee?: {
    user: {
      name: string;
    };
  };
};

type BillWithDetails = {
  id: string;
  billNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  patient: {
    name: string;
    patientId: string;
  };
  appointment?: {
    serialNumber: number;
    queuePosition: number;
    appointmentDate: Date | string;
    doctor: {
      user: {
        name: string;
      };
    };
  };
  billItems: BillItem[];
  payments: Payment[];
};

type InvoiceModalProps = {
  appointmentId: string;
  currentEmployeeId: string;
  paymentMethods: PaymentMethod[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceModal({
  appointmentId,
  currentEmployeeId,
  paymentMethods,
  open,
  onOpenChange,
}: InvoiceModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billData, setBillData] = useState<BillWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");

  const handleOpen = async () => {
    if (!appointmentId) return;

    setIsLoading(true);
    try {
      // Fetch appointment to get bill ID
      const appointment = await client.appointments.getOne({
        id: appointmentId,
      });

      if (!appointment.bills || appointment.bills.length === 0) {
        toast.error("No bill found for this appointment");
        handleClose();
        return;
      }

      const billId = appointment.bills[0].id;
      const bill = await client.bills.getWithPayments({ id: billId });
      setBillData(bill as BillWithDetails);
    } catch (error) {
      toast.error("Failed to load invoice data");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBillData(null);
    setPaymentMethod("");
    onOpenChange(false);
  };

  // Fetch data when modal opens
  if (open && !billData && !isLoading && appointmentId) {
    handleOpen();
  }

  const handleConfirmPayment = async () => {
    if (!billData) return;

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsSubmitting(true);

    const { error } = await safeClient.payments.create({
      billId: billData.id,
      amount: billData.dueAmount,
      paymentMethod,
      receivedBy: currentEmployeeId,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || "Failed to process payment");
    } else {
      toast.success("Payment confirmed successfully!");
      handleClose();
      router.refresh();
    }
  };

  const handlePrint = () => {
    toast.info("Print functionality coming soon!");
  };

  const isPaid = billData?.status === "PAID";
  const hasDue = billData?.dueAmount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {billData ? `Invoice #${billData.billNumber}` : "Invoice"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : !billData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">No invoice data available</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bill Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">📋 Bill Information</h3>
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
              <h3 className="text-sm font-semibold">💰 Bill Details</h3>
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
                    {billData.billItems.map((item: any) => (
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

              {/* Bill Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Bill Status:
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    billData.status === "PAID"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : billData.status === "PARTIAL"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  }`}
                >
                  {billData.status}
                </span>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">💳 Payment History</h3>
              {billData.payments && billData.payments.length > 0 ? (
                <div className="space-y-2">
                  {billData.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {format(new Date(payment.paymentDate), "PPP p")} - ৳
                          {payment.amount.toFixed(2)} ({payment.paymentMethod})
                        </div>
                        {payment.receivedByEmployee && (
                          <div className="text-xs text-muted-foreground">
                            Received by: {payment.receivedByEmployee.user.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  No payments yet
                </div>
              )}
            </div>

            {/* Payment Form (only show if there's due amount) */}
            {hasDue && (
              <div className="space-y-3 border-t pt-6">
                <h3 className="text-sm font-semibold">💵 Confirm Payment</h3>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Amount to Pay:
                    </span>
                    <span className="text-lg font-bold">
                      ৳{billData.dueAmount.toFixed(2)}
                    </span>
                  </div>
                  <Field>
                    <FieldLabel>
                      Payment Method <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {isPaid ? (
                <Button onClick={handlePrint}>
                  <LuPrinter className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
              ) : (
                <Button onClick={handleConfirmPayment} isLoading={isSubmitting}>
                  <LuCheck className="mr-2 h-4 w-4" />
                  Confirm Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
