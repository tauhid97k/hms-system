import { getSession } from "@/lib/auth";
import { client } from "@/lib/orpc";
import prisma from "@/lib/prisma";
import { NewAppointmentForm } from "../_components/new-appointment-form";

export default async function NewAppointmentPage() {
  // Get current session
  const session = await getSession();

  // Get employee record for the current user (if logged in)
  let employeeId = "";

  if (session?.user?.id) {
    const employee = await prisma.employees.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (employee) {
      employeeId = employee.id;
    }
  }

  // For now, if no employee record, we'll use the first available employee
  // This is temporary - in production you'd enforce proper auth
  if (!employeeId) {
    const firstEmployee = await prisma.employees.findFirst({
      select: { id: true },
    });
    if (firstEmployee) {
      employeeId = firstEmployee.id;
    }
  }

  // Server-side data fetching - fetch all active patients and doctors
  // Since we need all records for dropdowns, we'll fetch multiple pages if needed
  const fetchAllPatients = async () => {
    const firstPage = await client.patients.getAll({
      page: 1,
      limit: 100,
      isActive: "true",
    });
    let allPatients = [...firstPage.data];

    // If there are more pages, fetch them
    const totalPages = Math.ceil(firstPage.meta.total / firstPage.meta.limit);
    if (totalPages > 1) {
      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          client.patients.getAll({ page: i + 2, limit: 100, isActive: "true" }),
        ),
      );
      allPatients = [...allPatients, ...remainingPages.flatMap((p) => p.data)];
    }

    return allPatients;
  };

  const fetchAllDoctors = async () => {
    const firstPage = await client.doctors.getAll({
      page: 1,
      limit: 100,
      isAvailable: "true",
    });
    let allDoctors = [...firstPage.data];

    // If there are more pages, fetch them
    const totalPages = Math.ceil(firstPage.meta.total / firstPage.meta.limit);
    if (totalPages > 1) {
      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          client.doctors.getAll({
            page: i + 2,
            limit: 100,
            isAvailable: "true",
          }),
        ),
      );
      allDoctors = [...allDoctors, ...remainingPages.flatMap((p) => p.data)];
    }

    return allDoctors;
  };

  const [patients, doctors] = await Promise.all([
    fetchAllPatients(),
    fetchAllDoctors(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">New Appointment</h1>
        <p className="text-sm text-muted-foreground">
          Register a patient appointment and assign to a doctor. A bill will be
          automatically generated.
        </p>
      </div>

      <NewAppointmentForm
        patients={patients}
        doctors={doctors}
        currentEmployeeId={employeeId}
      />
    </div>
  );
}
