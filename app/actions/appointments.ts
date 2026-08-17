"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import { MediaMode } from "@vonage/video";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export enum PlanType {
  Free = "Free",
  FlexPay_30m = "FlexPay_30m",
  FlexPay_45m = "FlexPay_45m",
  FlexPay_60m = "FlexPay_60m",
  Monthly = "Monthly",
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
        status: "Active",
      },

      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        phoneNumber: true,
        onboardingCompleted: true,
        lastLoginAt: true,
        verificationStatus: true,

        facilitatorProfile: {
          select: {
            specialty: true,
            experience: true,
            description: true,
            credentialUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    return {
      educator: {
        id: educator.id,
        name: educator.name,
        email: educator.email,
        imageUrl: educator.imageUrl,

        role: educator.role,
        status: educator.status,

        createdAt: educator.createdAt,
        updatedAt: educator.updatedAt,

        emailVerified: educator.emailVerified,

        phoneNumber: educator.phoneNumber,

        onboardingCompleted: educator.onboardingCompleted,

        lastLoginAt: educator.lastLoginAt,

        verificationStatus: educator.verificationStatus,

        specialty: educator.facilitatorProfile?.specialty ?? null,

        experience: educator.facilitatorProfile?.experience ?? null,

        description: educator.facilitatorProfile?.description ?? null,

        credentialUrl: educator.facilitatorProfile?.credentialUrl ?? null,
      },
    };
  } catch (error) {
    console.error("GET EDUCATOR BY ID ERROR:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch educator details.",
    );
  }
}

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
    const learnerId = session.user.id;
    const availabilityId = formData.get("availabilityId") as string;
    const learnerDescription = formData.get("learnerDescription") as string;
    const educatorId = formData.get("educatorId") as string;
    const startTime = new Date(formData.get("startTime") as string);
    const endTime = new Date(formData.get("endTime") as string);

    // 1. Extract the missing fields from formData
    const subject = formData.get("subject") as string;
    const gradeLevel = formData.get("gradeLevel") as string;
    const dateInput = formData.get("date") as string;
    const date = dateInput ? new Date(dateInput) : new Date(startTime); // Fallback to startTime if needed

    const paymentType = formData.get("paymentType") as "hourly" | "monthly";

    if (
      !educatorId ||
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime()) ||
      isNaN(date.getTime()) ||
      !availabilityId ||
      !paymentType ||
      !subject ||
      !gradeLevel
    ) {
      return {
        success: false,
        message: "Missing required booking information.",
      };
    }

    const appointmentDurationMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    if (appointmentDurationMinutes <= 0) {
      return {
        success: false,
        message: "Invalid appointment duration.",
      };
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. 🔥 UPDATED: CHECK FOR TIME OVERLAP FOR *THIS LEARNER* (Instead of checking availabilityId uniqueness)
      const learnerOverlappingAppointment = await tx.appointment.findFirst({
        where: {
          learnerId,
          status: { in: ["Scheduled", "Pending_payment"] },
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

      if (learnerOverlappingAppointment) {
        return {
          success: false,
          message:
            "You already have an appointment scheduled or pending payment that overlaps with this timeframe.",
        };
      }

      // 2. Validate Student
      const student = await tx.user.findFirst({
        where: {
          id: learnerId,
          role: "Learner",
        },
      });

      if (!student) {
        return {
          success: false,
          message: "Learner not found",
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

      // 4. Time Overlap Check for Educator (Unchanged - ensures the educator is free)
      const overLappingAppointment = await tx.appointment.findFirst({
        where: {
          educatorId,
          status: { in: ["Scheduled", "Pending_payment"] },
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
          message:
            "Educator is already booked or undergoing payment for this timeframe.",
        };
      }

      // 5. Initialize Video Session
      const sessionId = await createVideoSession();

      // 6. Save the booking in DB as 'Pending_payment' to reserve the spot
      const appointment = await tx.appointment.create({
        data: {
          learnerId: learnerId,
          educatorId,
          subject, // ✅ Added
          gradeLevel, // ✅ Added
          date, // ✅ Added
          startTime,
          endTime,
          learnerDescription,
          status: "Pending_payment",
          videoSessionId: sessionId,
        },
      });

      return {
        success: true,
        appointment,
      };
    });

    if (!transactionResult.success || !transactionResult.appointment) {
      return { success: false, message: transactionResult.message };
    }

    const savedAppointment = transactionResult.appointment;

    // ---------------- STRIPE CHECKOUT PAYLOAD INJECTION ----------------
    let lineItems: Stripe.Checkout.SessionCreateParams["line_items"] = [];

    if (paymentType === "monthly") {
      if (!process.env.STRIPE_MONTHLY_PRICE_ID) {
        throw new Error(
          "Missing STRIPE_MONTHLY_PRICE_ID configuration variable.",
        );
      }
      lineItems = [
        {
          price: process.env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ];
    } else {
      const hourlyRateInCents = 3500;
      const totalCostInCents = Math.round(
        (hourlyRateInCents / 60) * appointmentDurationMinutes,
      );

      if (totalCostInCents < 50) {
        throw new Error(
          "Invalid duration calculation; must exceed the minimum transaction rate of $0.50.",
        );
      }

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "One-on-One Live Math Tutoring",
              description: `Custom reservation for exactly ${appointmentDurationMinutes} minutes of instructional support.`,
            },
            unit_amount: totalCostInCents,
          },
          quantity: 1,
        },
      ];
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: paymentType === "monthly" ? "subscription" : "payment",
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancel`,
      metadata: {
        appointmentId: savedAppointment.id,
        paymentType: paymentType,
        learnerId: learnerId,
      },
    });

    revalidatePath("/learner");

    return {
      success: true,
      checkoutUrl: stripeSession.url,
    };
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
      message: "Error processing checkout session initialization.",
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
      appointment.learnerId !== user.id
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
