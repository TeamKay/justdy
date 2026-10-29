import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to view tutoring billing." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true, role: true },
  });
  if (!user || !user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email to view tutoring billing." },
      { status: 403 },
    );
  }
  if (String(user.role).toUpperCase() !== "LEARNER") {
    return NextResponse.json(
      { error: "Learner account required." },
      { status: 403 },
    );
  }

  // Exact user relation is preferred. Email fallback only shows records for this
  // authenticated, verified learner and supports records linked before rollout.
  const requests = await prisma.tutoringOnboardingRequest.findMany({
    where: {
      OR: [
        { learnerUserId: user.id },
        { learnerUserId: null, learnerEmail: user.email.trim().toLowerCase() },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      studentName: true,
      subject: true,
      learningGoals: true,
      agreedSchedule: true,
      sessionDurationMinutes: true,
      sessionsPerWeek: true,
      courseDurationWeeks: true,
      paymentPlan: true,
      installmentCount: true,
      courseTotalCents: true,
      amountPaidCents: true,
      currency: true,
      status: true,
      paymentStatus: true,
      planAgreedAt: true,
      tutoringPayments: {
        orderBy: { installmentNumber: "asc" },
        select: {
          id: true,
          installmentNumber: true,
          expectedAmountCents: true,
          currency: true,
          status: true,
          paidAt: true,
          emailSentAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((request) => ({
      ...request,
      amountPaidCents: request.amountPaidCents,
      remainingCents: Math.max(
        0,
        (request.courseTotalCents ?? 0) - request.amountPaidCents,
      ),
    })),
  });
}
