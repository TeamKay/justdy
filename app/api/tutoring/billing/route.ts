import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function courseTotalCents(r: {
  courseTotalCents: number | null;
  agreedRateCents: number | null;
  sessionsPerWeek: number | null;
  courseDurationWeeks: number | null;
}) {
  if (r.courseTotalCents != null) return r.courseTotalCents;
  if (
    r.agreedRateCents != null &&
    r.sessionsPerWeek != null &&
    r.courseDurationWeeks != null
  ) {
    return r.agreedRateCents * r.sessionsPerWeek * r.courseDurationWeeks;
  }
  return null;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session.user.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const email = session.user.email.trim().toLowerCase();
    const requests = await prisma.tutoringOnboardingRequest.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentName: true,
        subject: true,
        status: true,
        paymentStatus: true,
        currency: true,
        courseTotalCents: true,
        agreedRateCents: true,
        sessionsPerWeek: true,
        courseDurationWeeks: true,
        paymentPlan: true,
        installmentCount: true,
        tutoringPayments: {
          orderBy: { installmentNumber: "asc" },
          select: {
            id: true,
            installmentNumber: true,
            expectedAmountCents: true,
            currency: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      billing: requests.map((r) => {
        const totalCents = courseTotalCents(r);
        const paidCents = r.tutoringPayments
          .filter((p) => p.status.toLowerCase() === "paid")
          .reduce((sum, p) => sum + p.expectedAmountCents, 0);
        return {
          id: r.id,
          studentName: r.studentName,
          subject: r.subject,
          status: r.status,
          paymentStatus: r.paymentStatus,
          currency: (r.currency || "usd").toUpperCase(),
          totalCents,
          paidCents,
          remainingCents:
            totalCents == null ? null : Math.max(0, totalCents - paidCents),
          paymentPlan: r.paymentPlan,
          installmentCount: r.installmentCount,
          installments: r.tutoringPayments.map((p) => ({
            id: p.id,
            installmentNumber: p.installmentNumber,
            amountCents: p.expectedAmountCents,
            currency: p.currency.toUpperCase(),
            status: p.status,
            paidAt: p.paidAt,
          })),
        };
      }),
    });
  } catch (error) {
    console.error("Unable to load tutoring billing summary:", error);
    return NextResponse.json(
      { error: "Unable to load billing" },
      { status: 500 },
    );
  }
}
