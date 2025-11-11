"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LuPencil, LuUser } from "react-icons/lu";
import Link from "next/link";
import type { Patient } from "@/lib/dataTypes";

type PatientProfileProps = {
  patient: Patient & {
    _count?: {
      visits: number;
      documents: number;
      bills: number;
    };
  };
};

export function PatientProfile({ patient }: PatientProfileProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-6">
      <div className="flex flex-1 flex-col items-center text-center">
        {/* Top Section: Profile Image, Name, Status, ID */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-muted">
            <LuUser className="h-16 w-16 text-muted-foreground" />
          </div>

          <h2 className="mb-2 text-xl font-medium">{patient.name}</h2>
          <Badge variant={patient.isActive ? "default" : "secondary"} className="mb-4">
            {patient.isActive ? "Active" : "Inactive"}
          </Badge>

          <p className="mb-6 font-mono text-sm text-muted-foreground">
            {patient.patientId}
          </p>
        </div>

        {/* Middle Section: Stats */}
        {patient._count && (
          <div className="mb-6 grid w-full grid-cols-3 gap-4 border-y py-4">
            <div>
              <p className="text-2xl font-bold">{patient._count.visits}</p>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{patient._count.documents}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{patient._count.bills}</p>
              <p className="text-xs text-muted-foreground">Bills</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Edit Button */}
      <Button asChild className="mt-auto w-full">
        <Link href={`/dashboard/patients/${patient.id}/edit`}>
          <LuPencil />
          Edit Patient
        </Link>
      </Button>
    </div>
  );
}
