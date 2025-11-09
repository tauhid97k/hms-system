"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import {
  LuActivity,
  LuCalendar,
  LuClock,
  LuFileText,
  LuFlask,
  LuPill,
  LuUser,
  LuDollarSign,
  LuCheckCircle2,
  LuAlertCircle,
  LuDownload,
} from "react-icons/lu";

type JourneyEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  performedBy: string;
  metadata?: any;
  icon: string;
  color: string;
};

type Visit = {
  id: string;
  status: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  bills?: any[];
  prescriptions?: any[];
  labTests?: any[];
};

type VisitTimelineProps = {
  journey: JourneyEvent[];
  visit: Visit;
};

// Icon mapping
const iconMap: Record<string, any> = {
  calendar: LuCalendar,
  user: LuUser,
  clock: LuClock,
  activity: LuActivity,
  pill: LuPill,
  flask: LuFlask,
  dollar: LuDollarSign,
  file: LuFileText,
  check: LuCheckCircle2,
  alert: LuAlertCircle,
};

// Color mapping
const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-gray-500",
};

export function VisitTimeline({ journey, visit }: VisitTimelineProps) {
  if (journey.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <LuAlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No Journey Data</h3>
        <p className="text-sm text-muted-foreground">
          This visit doesn't have any recorded events yet. Events will appear here as
          the patient progresses through their visit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Events */}
      <div className="rounded-xl border bg-card p-6">
        <div className="relative space-y-8">
          {journey.map((event, index) => {
            const Icon = iconMap[event.icon] || LuActivity;
            const colorClass = colorMap[event.color] || "bg-blue-500";
            const isLast = index === journey.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 h-full w-0.5 bg-border" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                    colorClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 pb-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{event.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                    {event.performedBy && (
                      <Badge variant="secondary">{event.performedBy}</Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  {event.metadata && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-sm text-muted-foreground">
                            {key.charAt(0).toUpperCase() +
                              key.slice(1).replace(/([A-Z])/g, " $1")}
                            :
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Bills */}
        {visit.bills && visit.bills.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <LuDollarSign className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Billing Information</h3>
            </div>
            <div className="space-y-2">
              {visit.bills.map((bill: any) => (
                <div key={bill.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bill #{bill.id.slice(0, 8)}</span>
                  <span className="font-medium">${bill.totalAmount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescriptions */}
        {visit.prescriptions && visit.prescriptions.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <LuPill className="h-5 w-5 text-purple-500" />
              <h3 className="font-medium">Prescriptions</h3>
            </div>
            <div className="space-y-2">
              {visit.prescriptions.map((prescription: any) => (
                <div key={prescription.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {prescription.prescriptionItems?.length || 0} medication(s) prescribed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Tests */}
        {visit.labTests && visit.labTests.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <LuFlask className="h-5 w-5 text-orange-500" />
              <h3 className="font-medium">Lab Tests</h3>
            </div>
            <div className="space-y-2">
              {visit.labTests.map((labTest: any) => (
                <div key={labTest.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{labTest.test?.name}</span>
                    <Badge variant="secondary">{labTest.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
