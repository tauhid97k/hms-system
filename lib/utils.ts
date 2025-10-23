import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// CSS utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
