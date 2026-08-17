"use server";

import {
  EnrollmentTrack,
  PendingEnrollmentStatus,
} from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import FreeConsultationEmail from "../_components/emails/ConsultationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface FreeConsultationInput {
  name: string;
  email: string;
  phoneNumber?: string;
  gradeLevel: string;
  subject: string;
  topic?: string;
  sessionDate: string;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  educatorId?: string;
}

export async function createFreeConsultation(data: FreeConsultationInput) {
  try {
    const baseDate = new Date(data.sessionDate);
    let hours = parseInt(data.startHour, 10);
    const minutes = parseInt(data.startMinute, 10);

    if (data.startPeriod === "PM" && hours < 12) hours += 12;
    if (data.startPeriod === "AM" && hours === 12) hours = 0;

    const startTime = new Date(baseDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

    // 1. Save pending enrollment in DB
    const pendingEnrollment = await prisma.pendingEnrollment.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber?.trim() || null,
        gradeLevel: data.gradeLevel,
        subject: data.subject,
        topic: data.topic || null,
        enrollmentType: EnrollmentTrack.Monthly,
        sessionDate: baseDate,
        startTime: startTime,
        endTime: endTime,
        educatorId: data.educatorId || null,
        amount: 0,
        status: PendingEnrollmentStatus.Pending,
      },
    });

    // 2. Create or sync User record
    await prisma.user.upsert({
      where: { email: data.email.toLowerCase().trim() },
      update: {
        name: data.name,
        phoneNumber: data.phoneNumber?.trim() || undefined,
      },
      create: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber?.trim() || null,
        role: "Learner",
        onboardingCompleted: true,
      },
    });

    // 3. Format Date and Time strings for the Email
    const formattedDate = baseDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timeString = `${data.startHour}:${data.startMinute} ${data.startPeriod}`;

    // 4. Send Confirmation Email via Resend
    await resend.emails.send({
      from: "Consultations <onboarding@justdy.com>", // Updated to your verified domain!
      to: [data.email.toLowerCase().trim()],
      subject: `Confirmed: Your Free Consultation for ${data.subject}`,
      react: FreeConsultationEmail({
        name: data.name,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        sessionDate: formattedDate,
        startTime: timeString,
        purpose: data.topic || undefined,
      }),
    });

    return { success: true, data: pendingEnrollment };
  } catch (error) {
    console.error("Failed to save free consultation or send email:", error);
    return { success: false, error: "Failed to schedule consultation." };
  }
}
