"use client";

import { MetaData } from "@/lib/dataTypes";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface PaginationProps {
  meta: MetaData;
  onPageChange: (page: string) => void;
  onLimitChange: (limit: string) => void;
}

export const Pagination = ({
  meta,
  onPageChange,
  onLimitChange,
}: PaginationProps) => {
  // Destructure & normalize meta values
  const { page: pageRaw, limit: limitRaw, total } = meta;
  const page = Number.isFinite(Number(pageRaw)) ? Number(pageRaw) : 1;
  const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 10;

  // Calculate total pages & safe page range
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // If only one page or no data, return null
  if (totalPages <= 1 && total <= 10) return null;

  // Disable prev/next when at edges or no data
  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;

  // Calculate first and last item in the current page
  const firstItem = (safePage - 1) * limit + 1;
  const lastItem = Math.min(total, safePage * limit);

  // Handle previous button
  const handlePrev = () => {
    if (!prevDisabled) onPageChange(String(safePage - 1));
  };

  // Handle next button
  const handleNext = () => {
    if (!nextDisabled) onPageChange(String(safePage + 1));
  };

  // Handle limit change
  const handleLimitChange = (value: string) => {
    onPageChange("1");
    onLimitChange(value);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
      {/* Pagination info */}
      <div className="flex items-center gap-3 text-sm">
        <div>{`Showing ${firstItem} - ${lastItem} of ${total}`}</div>
      </div>

      {/* Pagination buttons & Limit selector */}
      <div className="flex items-center gap-3">
        <Select
          value={limit.toString()}
          onValueChange={(value) => handleLimitChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} Items
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={handlePrev}
          disabled={prevDisabled}
          aria-label="Previous page"
        >
          <LuChevronLeft />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={handleNext}
          disabled={nextDisabled}
          aria-label="Next page"
        >
          <LuChevronRight />
        </Button>
      </div>
    </div>
  );
};
