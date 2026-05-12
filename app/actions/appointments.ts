"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays, endOfDay, addMinutes, isBefore, format } from "date-fns";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";

import { MediaMode } from "@vonage/video";

interface TimeSlot {
  startTime: string;
  endTime: string;
  formatted: string;
  day: string;
  availabilityId: string;
}

const PLAN_LIMITS = {
  Free: 1,
  Standard: 8,
  Premium: Infinity,
};

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
    const educator = await prisma.user.findFirst({
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

// export async function bookAppointment(formData: FormData) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user.id) throw new Error("Unauthorized");

//   try {
//     const studentId = session.user.id;
//     const availabilityId = formData.get("availabilityId") as string;
//     const educatorId = formData.get("educatorId") as string;
//     const studentDescription = formData.get("description") as string;
//     const startTime = new Date(formData.get("startTime") as string);
//     const endTime = new Date(formData.get("endTime") as string);

//     if (
//       !educatorId ||
//       isNaN(startTime.getTime()) ||
//       isNaN(endTime.getTime()) ||
//       !availabilityId
//     ) {
//       throw new Error("Missing required booking information.");
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       // 1. CHECK FOR DUPLICATE BY SAME STUDENT
//       const alreadtBookedByMe = await tx.appointment.findFirst({
//         where: { availabilityId, studentId, status: "Scheduled" },
//       });

//       if (alreadtBookedByMe) {
//         throw new Error("You have already booked a seat in this session.");
//       }

//       // 2. Validate Student
//       const student = await tx.user.findUnique({
//         where: {
//           id: studentId,
//           role: "Student",
//         },
//         include: {
//           subscriptions: {
//             where: {
//               status: "Active",
//             },
//             orderBy: {
//               createdAt: "desc",
//             },
//             take: 1,
//           },
//         },
//       });

//       if (!student) {
//         throw new Error("Student not found");
//       }

//       // 3. Validate Educator
//       const educator = await tx.user.findUnique({
//         where: {
//           id: educatorId,
//           role: "Educator",
//           verificationStatus: "Verified",
//         },
//       });

//       if (!educator) {
//         throw new Error("Educator not found or not verified");
//       }

//       // 4. Time Overlap Check (Secondary Safety)
//       const overLappingAppointment = await tx.appointment.findFirst({
//         where: {
//           educatorId,
//           status: "Scheduled",
//           AND: [
//             {
//               startTime: {
//                 lt: endTime,
//               },
//             },
//             {
//               endTime: {
//                 gt: startTime,
//               },
//             },
//           ],
//         },
//       });

//       if (overLappingAppointment)
//         throw new Error("Educator is already booked for this timeframe.");

//       const sessionId = await createVideoSession();

//       // Get active subscription
//       const subscription = student.subscriptions[0];

//       const currentPlan = subscription?.plan || "Free";

//       // Monthly booking window
//       const now = new Date();

//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

//       // Count student's booked sessions THIS MONTH
//       const monthlySessions = await tx.appointment.count({
//         where: {
//           studentId,
//           status: {
//             in: ["Scheduled", "Completed"],
//           },
//           createdAt: {
//             gte: startOfMonth,
//             lt: endOfMonth,
//           },
//         },
//       });

//       // PLAN VALIDATION

//       // FREE PLAN
//       if (currentPlan === "Free" && monthlySessions >= PLAN_LIMITS.Free) {
//         throw new Error(
//           "You have already used your free live session. Upgrade to Standard or Premium to continue booking sessions.",
//         );
//       }

//       // STANDARD PLAN
//       if (
//         currentPlan === "Standard" &&
//         monthlySessions >= PLAN_LIMITS.Standard
//       ) {
//         throw new Error(
//           "You have reached your 8 monthly live sessions limit on the Standard plan. Upgrade to Premium for unlimited sessions.",
//         );
//       }

//       // PREMIUM = unlimited

//       // 6. Create Appointment
//       return await tx.appointment.create({
//         data: {
//           studentId,
//           educatorId,
//           availabilityId,
//           startTime,
//           endTime,
//           studentDescription,
//           status: "Scheduled",
//           videoSessionId: sessionId,
//         },
//       });
//     });

//     revalidatePath("/student");
//     return { success: true, appointment: result };
//   } catch (error: unknown) {
//     console.error("Create appointment error:", error);

//     if (error instanceof Error) {
//       throw new Error(error.message);
//     }

//     throw new Error("Error creating appointment");
//   }
// }

export async function bookAppointment(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

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
      return {
        success: false,
        message: "Missing required booking information.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. CHECK FOR DUPLICATE BY SAME STUDENT
      const alreadyBookedByMe = await tx.appointment.findFirst({
        where: {
          availabilityId,
          studentId,
          status: "Scheduled",
        },
      });

      if (alreadyBookedByMe) {
        return {
          success: false,
          message: "You have already booked a seat in this session.",
        };
      }

      // 2. Validate Student
      const student = await tx.user.findFirst({
        where: {
          id: studentId,
          role: "Student",
        },
        include: {
          subscription: true,
        },
      });

      if (!student) {
        return {
          success: false,
          message: "Student not found",
        };
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
        return {
          success: false,
          message: "Educator not found or not verified",
        };
      }

      // 4. Time Overlap Check
      const overLappingAppointment = await tx.appointment.findFirst({
        where: {
          educatorId,
          status: "Scheduled",
          AND: [
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

      if (overLappingAppointment) {
        return {
          success: false,
          message: "Educator is already booked for this timeframe.",
        };
      }

      const sessionId = await createVideoSession();

      // Get active subscription
      const subscription = student.subscription;

      const currentPlan = subscription?.planId || "Free";

      // Monthly booking window
      const now = new Date();

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Count monthly sessions
      const monthlySessions = await tx.appointment.count({
        where: {
          studentId,
          status: {
            in: ["Scheduled", "Completed"],
          },
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      // FREE PLAN LIMIT
      if (currentPlan === "Free" && monthlySessions >= PLAN_LIMITS.Free) {
        return {
          success: false,
          upgradeRequired: true,
          plan: "Free",
          message:
            "You have already used your free live session. Upgrade to Standard or Premium to continue booking sessions.",
        };
      }

      // STANDARD PLAN LIMIT
      if (
        currentPlan === "Standard" &&
        monthlySessions >= PLAN_LIMITS.Standard
      ) {
        return {
          success: false,
          upgradeRequired: true,
          plan: "Standard",
          message:
            "You have reached your 8 monthly live sessions limit on the Standard plan. Upgrade to Premium for unlimited sessions.",
        };
      }

      // Create appointment
      const appointment = await tx.appointment.create({
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

      return {
        success: true,
        appointment,
      };
    });

    revalidatePath("/student");

    return result;
  } catch (error: unknown) {
    console.error("Create appointment error:", error);

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: "Error creating appointment",
    };
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
