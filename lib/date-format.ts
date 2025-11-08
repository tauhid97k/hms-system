import { format } from "date-fns";

// Format only as date
export const formatDate = (date: string | Date) => {
  if (!date) return;

  return format(new Date(date), "dd MMM yyyy");
};

// Format as date and time
export const formatDateTime = (date: string | Date) => {
  if (!date) return;

  return format(new Date(date), "dd MMM yyyy - hh:mm a");
};
