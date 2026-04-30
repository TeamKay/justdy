"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getStudentAppointments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Student",
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error("Student not found");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        educator: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },

        // ✅ FIX: include student to match Appointment type
        student: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return {
      appointments,
      error: null,
    };
  } catch (error) {
    return {
      appointments: [],
      error: "Failed to fetch appointments: " + (error ?? "Unknown error"),
    };
  }
}
