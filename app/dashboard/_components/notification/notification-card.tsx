import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuBell, LuX } from "react-icons/lu";

interface NotificationProps {
  id: number;
  type: string,
  title: string;
  message: string;
  time: string;
  readAt: string | null;
}

const NotificationCard = ({
  title,
  message,
  time,
  readAt,
}: NotificationProps) => {
  return (
    <div className="flex items-center justify-between hover:bg-accent/30">
      <div
        className={cn(
          "flex w-full gap-4 border-l-2 border-transparent p-4",
          readAt ? "opacity-80" : "border-primary",
        )}
      >
        <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary p-2">
          <LuBell className="icon" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <p className={cn("text-sm", !readAt && "font-semibold")}>{title}</p>
            <button
              aria-label="Close"
              type="button"
              className="inline-flex size-6 items-center justify-center opacity-70 hover:opacity-100"
            >
              <LuX className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex items-end justify-between text-sm">
            <p className="text-muted-foreground">{time}</p>
            <Link href="#" className="text-primary hover:underline">View</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
