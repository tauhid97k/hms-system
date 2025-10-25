"use client";

import { PaginatedData } from "@/lib/dataTypes";
import { cn } from "@/lib/utils";

interface PaginationProps<T> {
  meta: PaginatedData<T>["meta"];
  onPageChange: (page: string) => void;
}

export const Pagination = <T,>({ meta, onPageChange }: PaginationProps<T>) => {
  // Return null if there's only one page or no data.
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {meta.links.map((link, index) => {
        // Extract page number from the URL string
        const pageNumber = link.url
          ? new URL(link.url).searchParams.get("page")
          : null;

        // Render buttons
        return link.url && pageNumber ? (
          <button
            key={index}
            onClick={() => onPageChange(pageNumber)}
            dangerouslySetInnerHTML={{ __html: link.label }}
            className={cn(
              "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md p-3 transition-colors",
              {
                "bg-primary text-primary-foreground": link.active,
                "hover:bg-secondary": !link.active,
              },
            )}
            disabled={link.active}
          />
        ) : (
          <span
            className="flex h-10 items-center justify-center rounded-md p-3 opacity-50"
            key={index}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        );
      })}
    </div>
  );
};
