import prisma from "@/lib/prisma";
import { getVisitJourney } from "@/lib/visit-events";
import { os } from "@orpc/server";
import { string } from "yup";

// Get visit by ID with full journey
export const getVisit = os
  .route({
    method: "GET",
    path: "/visits/:id",
    summary: "Get visit by ID with full journey",
  })
  .input(string().required())
  .handler(async ({ input }) => {
    const visit = await prisma.visits.findUnique({
      where: { id: input },
      include: {
        patient: true,
        department: true,
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        bills: {
          include: {
            billItems: true,
          },
        },
        prescriptions: {
          include: {
            prescriptionItems: true,
          },
        },
        labTests: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!visit) {
      throw new Error("Visit not found");
    }

    // Get journey timeline from event sourcing
    const journey = await getVisitJourney(input);

    return {
      ...visit,
      journey,
    };
  });
