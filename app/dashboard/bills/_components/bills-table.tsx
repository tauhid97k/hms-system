"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import type { PaginatedData, Bill } from "@/lib/dataTypes";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/date-format";
import { LuEllipsisVertical, LuEye, LuPrinter } from "react-icons/lu";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { Input } from "@/components/ui/input";

type BillsTableProps = {
  initialData: PaginatedData<Bill>;
};

const statusConfig = {
  PENDING: { label: "Pending", variant: "warning" as const },
  PARTIAL: { label: "Partial", variant: "secondary" as const },
  PAID: { label: "Paid", variant: "success" as const },
  REFUNDED: { label: "Refunded", variant: "secondary" as const },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const },
};

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function BillsTable({ initialData }: BillsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);

  // Auto-search when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch !== (searchParams.get("search") || "")) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch, router, searchParams]);

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setOpenBillDialog(true);
  };

  const handlePrintBill = (bill: Bill) => {
    // TODO: Implement print bill functionality
    toast.info("Print bill functionality will be implemented soon");
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleLimitChange = (limit: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: "billNumber",
      header: "Bill Number",
      cell: ({ row }) => (
        <div className="font-mono font-semibold">
          {row.original.billNumber}
        </div>
      ),
    },
    {
      accessorKey: "patient.name",
      header: "Patient",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.patient?.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.patient?.patientId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "billableType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">
          {capitalizeFirst(row.original.billableType || "general")}
        </Badge>
      ),
    },
    {
      accessorKey: "billItems",
      header: "Billed Items",
      cell: ({ row }) => {
        const itemCount = row.original.billItems?.length || 0;
        return (
          <div className="text-center">
            {itemCount > 0 ? (
              <Badge variant="outline">{itemCount}</Badge>
            ) : (
              <span className="text-muted-foreground">0</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          ${row.original.totalAmount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid",
      cell: ({ row }) => (
        <div className="text-sm">
          ${row.original.paidAmount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "dueAmount",
      header: "Due",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-destructive">
          ${row.original.dueAmount.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "billingDate",
      header: "Bill Date",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTime(row.original.billingDate)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const bill = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <LuEllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewBill(bill)}>
                <LuEye />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintBill(bill)}>
                <LuPrinter />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Bills & Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Manage patient bills, payments, and transactions
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <Input
            type="search"
            placeholder="Search by bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DUE">Due</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={initialData.data} />
        <Pagination
          meta={initialData.meta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Bill Details Dialog */}
      <Dialog open={openBillDialog} onOpenChange={setOpenBillDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bill Number</p>
                  <p className="font-mono font-semibold">
                    {selectedBill.billNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedBill.status].variant}>
                    {statusConfig[selectedBill.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedBill.patient?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBill.patient?.patientId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bill Date</p>
                  <p className="text-sm">
                    {formatDateTime(selectedBill.billingDate)}
                  </p>
                </div>
              </div>

              {/* Bill Items */}
              <div>
                <h3 className="mb-3 font-semibold">Billed Items</h3>
                <div className="space-y-2">
                  {selectedBill.billItems && selectedBill.billItems.length > 0 ? (
                    selectedBill.billItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                            {item.discount > 0 &&
                              ` (Discount: $${item.discount.toFixed(2)})`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${item.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No items found
                    </p>
                  )}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${selectedBill.totalAmount.toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">
                      -${selectedBill.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>${selectedBill.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-success">
                    ${selectedBill.paidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Amount Due</span>
                  <span className="text-destructive">
                    ${selectedBill.dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenBillDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => selectedBill && handlePrintBill(selectedBill)}>
              <LuPrinter />
              Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
