import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
        teachingProfile: { select: { verificationStatus: true } },
      },
    });
    const role = String(actor?.role ?? "").toUpperCase();
    const allowed =
      Boolean(actor?.emailVerified) &&
      (role === "ADMIN" ||
        (role === "TUTOR" &&
          actor?.status === "Active" &&
          actor.teachingProfile?.verificationStatus === "Verified"));
    if (!actor || !allowed)
      return NextResponse.json(
        { error: "Administrator or verified active tutor access required." },
        { status: 403 },
      );
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      learnerEmail?: unknown;
      billingEmail?: unknown;
    };
    const learnerEmail =
      typeof body.learnerEmail === "string"
        ? body.learnerEmail.trim().toLowerCase()
        : "";
    const billingEmail =
      typeof body.billingEmail === "string"
        ? body.billingEmail.trim().toLowerCase()
        : "";
    if (!validEmail(learnerEmail))
      return NextResponse.json(
        { error: "Enter a valid learner email address." },
        { status: 422 },
      );
    if (!validEmail(billingEmail))
      return NextResponse.json(
        { error: "Enter a valid payment recipient email address." },
        { status: 422 },
      );
    const row = await prisma.tutoringOnboardingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        assignedTutorId: true,
        learnerEmail: true,
        learnerUserId: true,
        billingEmail: true,
      },
    });
    if (!row)
      return NextResponse.json(
        { error: "Tutoring request not found." },
        { status: 404 },
      );
    if (role !== "ADMIN" && row.assignedTutorId !== actor.id)
      return NextResponse.json(
        { error: "You can only manage requests assigned to you." },
        { status: 403 },
      );
    if (
      row.learnerUserId &&
      row.learnerEmail?.trim().toLowerCase() !== learnerEmail
    )
      return NextResponse.json(
        {
          error:
            "A learner account is already linked. Do not change the learner email after account creation; resolve the account link manually.",
        },
        { status: 409 },
      );
    if (
      row.paymentStatus !== "not_requested" &&
      row.billingEmail?.trim().toLowerCase() !== billingEmail
    )
      return NextResponse.json(
        {
          error:
            "A payment has already been requested. Do not change the payer email after sending a payment link.",
        },
        { status: 409 },
      );
    const updated = await prisma.tutoringOnboardingRequest.update({
      where: { id },
      data: { learnerEmail, billingEmail },
      select: { learnerEmail: true, billingEmail: true },
    });
    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    console.error("[tutoring request email update]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save email addresses.",
      },
      { status: 500 },
    );
  }
}
