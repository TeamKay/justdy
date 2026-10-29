import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isText = (value: unknown): value is string => typeof value === "string";

const isIntegerInRange = (
  value: unknown,
  min: number,
  max: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
        teachingProfile: {
          select: { verificationStatus: true },
        },
      },
    });

    if (!actor || !actor.emailVerified) {
      return NextResponse.json(
        { error: "A verified signed-in account is required." },
        { status: 403 },
      );
    }

    const role = String(actor.role ?? "").toUpperCase();
    const isAdmin = role === "ADMIN";
    const isVerifiedTutor =
      role === "TUTOR" &&
      actor.status === "Active" &&
      actor.teachingProfile?.verificationStatus === "Verified";

    if (!isAdmin && !isVerifiedTutor) {
      return NextResponse.json(
        {
          error: "Administrator or verified active tutor access required.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const existing = await prisma.tutoringOnboardingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        gradeLevel: true,
        assignedTutorId: true,
        paymentStatus: true,
        paymentPlan: true,
        installmentCount: true,
        courseTotalCents: true,
        tutoringPayments: {
          select: {
            id: true,
            status: true,
            stripeCheckoutSessionId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tutoring request not found." },
        { status: 404 },
      );
    }

    if (!isAdmin && existing.assignedTutorId !== actor.id) {
      return NextResponse.json(
        {
          error: "You can only update requests assigned to you.",
        },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const action = data.action;

    if (action !== "save_draft" && action !== "mark_agreed") {
      return NextResponse.json(
        { error: "Unsupported plan action." },
        { status: 400 },
      );
    }

    // Once any payment record/session exists or payment activity has begun,
    // financial terms must not be changed through this endpoint. Amendments
    // require a separate, audited workflow rather than silently invalidating
    // a Stripe Checkout session or changing the expected installment amounts.
    const paymentActivityStarted =
      existing.paymentStatus !== "not_requested" ||
      existing.tutoringPayments.length > 0;
    if (paymentActivityStarted) {
      return NextResponse.json(
        {
          error:
            "Payment activity has started for this request. The agreed plan is locked; use an audited plan-amendment workflow to change its terms.",
        },
        { status: 409 },
      );
    }

    const subject = isText(data.subject) ? data.subject.trim() : "";
    const learningGoals = isText(data.learningGoals)
      ? data.learningGoals.trim()
      : "";
    const agreedSchedule = isText(data.agreedSchedule)
      ? data.agreedSchedule.trim()
      : "";
    const planNotes = isText(data.planNotes) ? data.planNotes.trim() : "";
    const currency = isText(data.currency)
      ? data.currency.toLowerCase()
      : "usd";

    const duration = data.sessionDurationMinutes;
    const sessions = data.sessionsPerWeek;
    const courseWeeks = data.courseDurationWeeks;
    const rateCents = data.agreedRateCents;
    const paymentPlan = data.paymentPlan;
    const installmentCount = data.installmentCount;

    const validRate =
      rateCents === null ||
      (typeof rateCents === "number" &&
        Number.isSafeInteger(rateCents) &&
        rateCents > 0 &&
        rateCents <= 100_000_000);

    if (
      subject.length > 160 ||
      learningGoals.length > 5000 ||
      agreedSchedule.length > 1000 ||
      planNotes.length > 5000
    ) {
      return NextResponse.json(
        { error: "One or more plan fields are too long." },
        { status: 400 },
      );
    }

    if (duration != null && !isIntegerInRange(duration, 15, 240)) {
      return NextResponse.json(
        { error: "Session duration must be between 15 and 240 minutes." },
        { status: 400 },
      );
    }

    if (sessions != null && !isIntegerInRange(sessions, 1, 14)) {
      return NextResponse.json(
        { error: "Sessions per week must be between 1 and 14." },
        { status: 400 },
      );
    }

    if (courseWeeks != null && !isIntegerInRange(courseWeeks, 1, 104)) {
      return NextResponse.json(
        { error: "Course length must be between 1 and 104 weeks." },
        { status: 400 },
      );
    }

    if (!validRate) {
      return NextResponse.json(
        { error: "Enter a valid positive rate per session." },
        { status: 400 },
      );
    }

    if (!["usd", "ghs", "gbp", "eur"].includes(currency)) {
      return NextResponse.json(
        { error: "Unsupported currency." },
        { status: 400 },
      );
    }

    if (
      paymentPlan != null &&
      paymentPlan !== "full" &&
      paymentPlan !== "installments"
    ) {
      return NextResponse.json(
        { error: "Choose full payment or installments." },
        { status: 400 },
      );
    }

    if (
      installmentCount != null &&
      !isIntegerInRange(installmentCount, 2, 24) &&
      !(paymentPlan === "full" && installmentCount === 1)
    ) {
      return NextResponse.json(
        { error: "Installment count must be between 2 and 24." },
        { status: 400 },
      );
    }

    const resolvedPaymentPlan =
      paymentPlan === "installments"
        ? "installments"
        : paymentPlan === "full"
          ? "full"
          : null;

    if (
      action === "mark_agreed" &&
      (!subject?.trim() ||
        !learningGoals?.trim() ||
        !agreedSchedule.trim() ||
        !isIntegerInRange(duration, 15, 240) ||
        !isIntegerInRange(sessions, 1, 14) ||
        !isIntegerInRange(courseWeeks, 1, 104) ||
        typeof rateCents !== "number" ||
        !Number.isSafeInteger(rateCents) ||
        rateCents <= 0 ||
        !resolvedPaymentPlan)
    ) {
      return NextResponse.json(
        {
          error:
            "To agree to the plan, provide the subject, learning goals, agreed schedule, session duration, sessions per week, course length, rate per session, and payment plan.",
        },
        { status: 400 },
      );
    }

    if (
      action === "mark_agreed" &&
      resolvedPaymentPlan === "installments" &&
      !isIntegerInRange(installmentCount, 2, 24)
    ) {
      return NextResponse.json(
        {
          error:
            "Choose between 2 and 24 installments for an installment plan.",
        },
        { status: 400 },
      );
    }

    const agreedCourseTotalCents =
      action === "mark_agreed"
        ? (rateCents as number) * (sessions as number) * (courseWeeks as number)
        : null;

    if (
      action === "mark_agreed" &&
      (!Number.isSafeInteger(agreedCourseTotalCents) ||
        (agreedCourseTotalCents as number) <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "The agreed course total is outside the supported amount range.",
        },
        { status: 400 },
      );
    }

    // Planned onboarding sessions are placeholders only. They are created when
    // the plan is agreed, not when Stripe later confirms payment. Concrete
    // Booking/TutoringSession records remain the responsibility of booking.
    const plannedSessionCount =
      action === "mark_agreed"
        ? (sessions as number) * (courseWeeks as number)
        : 0;

    if (
      action === "mark_agreed" &&
      (!Number.isSafeInteger(plannedSessionCount) ||
        plannedSessionCount < 1 ||
        plannedSessionCount > 1456)
    ) {
      return NextResponse.json(
        {
          error:
            "The plan's planned-session count is outside the supported range.",
        },
        { status: 422 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.tutoringOnboardingRequest.update({
        where: { id },
        data: {
          subject: subject || null,
          learningGoals: learningGoals || null,
          agreedSchedule: agreedSchedule || null,
          sessionDurationMinutes: duration == null ? null : duration,
          sessionsPerWeek: sessions == null ? null : sessions,
          courseDurationWeeks: courseWeeks == null ? null : courseWeeks,
          agreedRateCents: rateCents == null ? null : rateCents,
          // Draft saves must not clear a previously stored total or write null
          // into non-nullable paymentPlan/installmentCount columns.
          ...(action === "mark_agreed"
            ? { courseTotalCents: agreedCourseTotalCents }
            : {}),
          currency,
          paymentPlan: resolvedPaymentPlan ?? existing.paymentPlan,
          installmentCount:
            resolvedPaymentPlan === "installments"
              ? typeof installmentCount === "number"
                ? installmentCount
                : existing.installmentCount
              : resolvedPaymentPlan === "full"
                ? 1
                : existing.installmentCount,
          planNotes: planNotes || null,
          status:
            action === "mark_agreed" ? "plan_agreed" : "planning_in_progress",
          planAgreedAt: action === "mark_agreed" ? new Date() : null,
          planAgreedById: action === "mark_agreed" ? actor.id : null,
          // Intentionally do not request or record payment here.
          // paymentStatus remains unchanged.
        },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          planAgreedAt: true,
          courseDurationWeeks: true,
          paymentPlan: true,
          installmentCount: true,
        },
      });

      if (action === "mark_agreed") {
        await tx.tutoringOnboardingSession.createMany({
          data: Array.from({ length: plannedSessionCount }, (_, index) => ({
            onboardingRequestId: id,
            sessionNumber: index + 1,
            status: "PENDING_CONFIRMATION",
            durationMinutes: duration as number,
            subject,
            gradeLevel: existing.gradeLevel,
          })),
          skipDuplicates: true,
        });

        // Keep unscheduled placeholders aligned if the plan is re-agreed
        // before payment begins. Do not alter placeholders already scheduled.
        await tx.tutoringOnboardingSession.updateMany({
          where: {
            onboardingRequestId: id,
            status: "PENDING_CONFIRMATION",
            scheduledStart: null,
          },
          data: {
            durationMinutes: duration as number,
            subject,
            gradeLevel: existing.gradeLevel,
          },
        });
      }

      return updatedRequest;
    });

    return NextResponse.json({
      success: true,
      request: updated,
      message:
        action === "mark_agreed"
          ? "Plan recorded as agreed. Payment has not been requested."
          : "Plan draft saved.",
    });
  } catch (error) {
    console.error("[tutoring plan PATCH]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the tutoring plan.",
      },
      { status: 500 },
    );
  }
}
