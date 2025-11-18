"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as React from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export interface AdvancedSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface AdvancedSelectProps {
  options: AdvancedSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export function AdvancedSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  className,
  disabled = false,
  emptyMessage = "No options found.",
}: AdvancedSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onChange?.(selectedValue === value ? "" : selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border-2 border-input bg-background px-3 py-2 text-sm transition-colors hover:border-input focus-visible:border-primary focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-muted-foreground",
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <LuChevronDown className="size-5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <LuCheck className="size-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
