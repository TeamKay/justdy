"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// 1. Define the parameter type
export default async function setAvailabilitySlots(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Educator",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (new Date(startTime) >= new Date(endTime)) {
      throw new Error("Start time must be before end time");
    }

    // 2. Include the relation so TypeScript sees 'appointment'
    const existingSlots = await prisma.availability.findMany({
      where: {
        educatorId: educator.id,
      },
      include: {
        appointments: true,
      },
    });

    // Filter slots that don't have an associated appointment
    const slotsToDelete = existingSlots
      .filter((slot) => !slot.appointments)
      .map((slot) => slot.id);

    if (slotsToDelete.length > 0) {
      await prisma.availability.deleteMany({
        where: {
          id: { in: slotsToDelete },
        },
      });
    }

    const newSlot = await prisma.availability.create({
      data: {
        educatorId: educator.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "Available",
      },
    });

    revalidatePath("/educator");
    return { success: true, slot: newSlot };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to set availability: ${error.message}`);
    }
    throw new Error("An unknown error occurred");
  }
}

export async function getEducatorAvailability() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Educator",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const availabilitySlots = await prisma.availability.findMany({
      where: {
        educatorId: session.user.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch availability slots: ${error.message}`);
    }
    throw new Error("An unknown error occurred");
  }
}

export async function getEducatorAppointments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: { id: session.user.id, role: "Educator" },
      select: { id: true },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        educatorId: educator.id,
      },
      include: {
        learner: true,
        educator: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return {
      appointments,
    };
  } catch (error) {
    throw new Error("Failed to fect appointments " + error);
  }
}

export async function cancelAppointment(formData: FormData) {
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
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        student: true,
        educator: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (
      appointment.educatorId !== user.id &&
      appointment.learnerId !== user.id
    ) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "Cancelled",
        },
      });

      // await tx.creditTransaction.create({
      //   data: {
      //     userId: appointment.studentId,
      //     amount: 2,
      //     type: "Appointment_Deduction",
      //     description: `Refund for cancelled appointment successful`,
      //   },
      // });

      // await tx.creditTransaction.create({
      //   data: {
      //     userId: appointment.educatorId,
      //     amount: -2,
      //     type: "Appointment_Deduction",
      //     description: `Refund for cancelled appointment successful`,
      //   },
      // });

      // await tx.user.update({
      //   where: {
      //     id: appointment.studentId,
      //   },
      //   data: {
      //     credits: {
      //       increment: 2,
      //     },
      //   },
      // });

      // await tx.user.update({
      //   where: {
      //     id: appointment.educatorId,
      //   },
      //   data: {
      //     credits: {
      //       decrement: 2,
      //     },
      //   },
      // });
    });

    if (user.role === "Educator") {
      revalidatePath("/educator");
    } else if (user.role === "Learner") {
      revalidatePath("/appointments");
    }

    return { success: true };
  } catch (error) {
    throw new Error("Failed to create appointment: " + error);
  }
}

export async function addAppointmentNotes(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: { id: session.user.id, role: "Educator" },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;
    const notes = formData.get("notes") as string;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        educatorId: educator.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath("/educator");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    throw new Error("Failed to update notes " + error);
  }
}

export async function markAppointmentCompleted(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: { id: session.user.id, role: "Educator" },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;

    if (!appointmentId) throw new Error("Appointment ID is required");

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        educatorId: educator.id,
      },
      include: {
        learner: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status !== "Scheduled") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot matk appointment as completed before the scheduled end time",
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "Completed",
      },
    });

    revalidatePath("/educator");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    throw new Error("Failed to mark appointment as complete " + error);
  }
}
