"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays, endOfDay, addMinutes, isBefore, format } from "date-fns";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import { deductCreditsForAppointment } from "./credits";
import { MediaMode } from "@vonage/video";

interface TimeSlot {
  startTime: string;
  endTime: string;
  formatted: string;
  day: string;
  availabilityId: string;
}

const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});

const vonage = new Vonage(credentials, {});

export async function getEducatorById(id: string) {
  try {
    const educator = await prisma.user.findFirst({
      where: {
        id,
        role: "Educator",
        verificationStatus: "Verified",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    return { educator };
  } catch (error) {
    throw new Error("Failed to fetch educator details" + error);
  }
}

export async function getAvailableTimeSlots(educatorId: string) {
  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: educatorId,
        role: "Educator",
        verificationStatus: "Verified",
      },
    });

    if (!educator) throw new Error("Educator not found");

    const availabilityRecords = await prisma.availability.findMany({
      where: {
        educatorId: educator.id,
        status: "Available",
      },
    });

    // Fix: Check length, not truthiness
    if (availabilityRecords.length === 0) {
      return {
        days: [],
        message: "This educator hasn't set their availability yet.",
      };
    }

    const now = new Date();
    const totalDaysToShow = 60;
    const days = Array.from({ length: totalDaysToShow }, (_, i) =>
      addDays(now, i),
    );

    const lastDay = endOfDay(days[days.length - 1]);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        educatorId: educator.id,
        status: "Scheduled",
        startTime: { lte: lastDay, gte: now },
      },
    });

    const availableSlotsByDay: Record<string, TimeSlot[]> = {};

    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];

      for (const record of availabilityRecords) {
        const availabilityStart = new Date(record.startTime);
        const availabilityEnd = new Date(record.endTime);

        availabilityStart.setFullYear(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
        );
        availabilityEnd.setFullYear(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
        );

        let current = new Date(availabilityStart);
        const end = new Date(availabilityEnd);

        while (
          isBefore(addMinutes(current, 60), end) ||
          +addMinutes(current, 60) === +end
        ) {
          const next = addMinutes(current, 60);

          if (isBefore(current, now)) {
            current = next;
            continue;
          }

          const overlaps = existingAppointments.some((appointment) => {
            const aStart = new Date(appointment.startTime);
            const aEnd = new Date(appointment.endTime);
            return current < aEnd && next > aStart;
          });

          if (!overlaps) {
            const isDuplicate = availableSlotsByDay[dayString].some(
              (s) => s.startTime === current.toISOString(),
            );

            if (!isDuplicate) {
              availableSlotsByDay[dayString].push({
                startTime: current.toISOString(),
                endTime: next.toISOString(),
                formatted: `${format(current, "h:mm a")} - ${format(next, "h:mm a")}`,
                day: format(current, "EEE, MMMM d"),
                availabilityId: record.id,
              });
            }
          }
          current = next;
        }
      }

      availableSlotsByDay[dayString].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    }
    const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
      date,
      displayDate:
        slots.length > 0 ? slots[0].day : format(new Date(date), "EEE, MMMM d"),
      slots,
    }));

    const totalFound = result.reduce((acc, day) => acc + day.slots.length, 0);

    return {
      days: result,
      totalFound: totalFound,
      hasAvailability: totalFound > 0,
      message:
        totalFound === 0 ? "No slots available for the next 4 days." : null,
    };
  } catch (error) {
    throw new Error("Failed to fetch available slots" + error);
  }
}

export async function bookAppointment(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) throw new Error("Unauthorized");

  try {
    const studentId = session.user.id;
    const availabilityId = formData.get("availabilityId") as string;
    const educatorId = formData.get("educatorId") as string;
    const studentDescription = formData.get("description") as string;
    const startTime = new Date(formData.get("startTime") as string);
    const endTime = new Date(formData.get("endTime") as string);

    if (
      !educatorId ||
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime()) ||
      !availabilityId
    ) {
      throw new Error("Missing required booking information.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. CHECK FOR DUPLICATE BY SAME STUDENT
      // We allow the slot to be booked multiple times, but NOT by the same person twice.
      const alreadtBookedByMe = await tx.appointment.findFirst({
        where: { availabilityId, studentId, status: "Scheduled" },
      });

      if (alreadtBookedByMe) {
        throw new Error("You have already booked a seat in this session.");
      }

      // 2. Validate Student & Credits
      const student = await tx.user.findUnique({
        where: {
          id: studentId,
          role: "Student",
        },
      });

      if (!student || (student.credits ?? 0) < 2) {
        throw new Error("Insufficient credits or Student not found");
      }

      // 3. Validate Educator
      const educator = await tx.user.findUnique({
        where: {
          id: educatorId,
          role: "Educator",
          verificationStatus: "Verified",
        },
      });

      if (!educator) {
        throw new Error("Educator not found or not verified");
      }

      // 4. Time Overlap Check (Secondary Safety)
      const overLappingAppointment = await tx.appointment.findFirst({
        where: {
          educatorId,
          status: "Scheduled",
          OR: [
            {
              startTime: {
                lt: endTime,
              },
            },
            {
              endTime: {
                gt: startTime,
              },
            },
          ],
        },
      });

      if (overLappingAppointment)
        throw new Error("Educator is already booked for this timeframe.");

      // 5. External Actions (Keep these inside the try but outside tx if possible,
      // but if you need atomicity, they stay here)
      const sessionId = await createVideoSession();

      const { success } = await deductCreditsForAppointment(
        studentId,
        educatorId,
      );

      if (!success) {
        throw new Error("Failed to deduct credits");
      }

      // 6. Create Appointment
      return await tx.appointment.create({
        data: {
          studentId,
          educatorId,
          availabilityId,
          startTime,
          endTime,
          studentDescription,
          status: "Scheduled",
          videoSessionId: sessionId,
        },
      });
    });

    revalidatePath("/student");
    return { success: true, appointment: result };
  } catch (error) {
    throw new Error("An unexpected error occurred" + error);
  }
}

async function createVideoSession(): Promise<string> {
  try {
    const session = await vonage.video.createSession({
      mediaMode: MediaMode.ROUTED,
    });

    return session.sessionId;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error("Failed to create video session: " + message);
  }
}

export async function generateVideoToken(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) throw new Error("Unauthorized");

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId || typeof appointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (
      appointment.educatorId !== user.id &&
      appointment.studentId !== user.id
    ) {
      throw new Error("You are not authorized to join this call");
    }

    if (appointment.status !== "Scheduled") {
      throw new Error("This appointment is not currently scheduled");
    }

    const now = new Date().getTime();
    const appointmentTime = new Date(appointment.startTime).getTime();
    const timeDifference = (appointmentTime - now) / (1000 * 60);

    if (timeDifference > 30) {
      throw new Error(
        "The call will be available 30 minutes before the scheduled time",
      );
    }

    if (!appointment.videoSessionId) {
      throw new Error(
        "Video session has not been initialized for this appointment",
      );
    }

    const appointmentEnTime = new Date(appointment.endTime).getTime();
    const expirationTime = Math.floor(appointmentEnTime / 1000) + 60 * 60;

    const connectionData = JSON.stringify({
      name: user.name,
      role: user.role,
      userId: user.id,
    });

    const token = vonage.video.generateClientToken(appointment.videoSessionId, {
      role: "publisher",
      expireTime: expirationTime,
      data: connectionData,
    });

    await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        videoSessionToken: token,
      },
    });

    return {
      success: true,
      videoSessionId: appointment.videoSessionId,
      token: token,
    };
  } catch (error) {
    throw new Error("Failed to generate video token" + error);
  }
}
