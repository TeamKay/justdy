import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TutoringRequestTable from "@/app/_components/TutoringRequestTable";

export const dynamic = "force-dynamic";

export default async function AdminTutoringRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth?mode=signin");
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      status: true,
    },
  });
  if (!viewer || String(viewer.role).toUpperCase() !== "ADMIN")
    redirect("/dashboard");
  if (!viewer.emailVerified)
    redirect(
      `/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`,
    );
  const [requests, tutors] = await Promise.all([
    prisma.tutoringOnboardingRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedTutor: { select: { id: true, name: true, email: true } },
        planAgreedBy: { select: { id: true, name: true } },
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
            checkoutUrl: true,
          },
        },
        tutoringOnboardingSessions: {
          orderBy: { sessionNumber: "asc" },
          select: {
            id: true,
            sessionNumber: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
            durationMinutes: true,
            timeZone: true,
            subject: true,
            gradeLevel: true,
            tutorNotes: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "TUTOR",
        status: "Active",
        emailVerified: true,
        teachingProfile: { is: { verificationStatus: "Verified" } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const assignmentOptions = [
    ...(viewer.status === "Active" && viewer.emailVerified
      ? [
          {
            id: viewer.id,
            name: viewer.name ?? "Administrator",
            email: viewer.email,
            assignmentLabel: "Myself (Admin)",
          },
        ]
      : []),
    ...tutors
      .filter((tutor) => tutor.id !== viewer.id)
      .map((tutor) => ({
        ...tutor,
        assignmentLabel: `${tutor.name} — ${tutor.email}`,
      })),
  ];
  const tableRequests = requests.map((request) => {
    const currency = (request.currency || "usd").toLowerCase();
    const calculatedTotal =
      request.agreedRateCents &&
      request.sessionsPerWeek &&
      request.courseDurationWeeks
        ? request.agreedRateCents *
          request.sessionsPerWeek *
          request.courseDurationWeeks
        : null;
    const totalCents = request.courseTotalCents ?? calculatedTotal;
    const paidCents = request.tutoringPayments
      .filter((p) => p.status.toLowerCase() === "paid")
      .reduce((sum, p) => sum + p.expectedAmountCents, 0);
    const remainingCents =
      totalCents === null ? null : Math.max(0, totalCents - paidCents);
    return {
      id: request.id,
      studentName: request.studentName,
      gradeLevel: request.gradeLevel,
      guardianName: request.guardianName,
      email: request.email,
      learnerEmail: request.learnerEmail ?? null,
      billingEmail: request.billingEmail ?? request.email,
      learnerUserId: request.learnerUserId ?? null,
      learnerAccountSetupSentAt:
        request.learnerAccountSetupSentAt?.toISOString() ?? null,
      phoneNumber: request.phoneNumber,
      preferredContact: request.preferredContact,
      potentialStartDate: request.potentialStartDate.toISOString(),
      createdAt: request.createdAt.toISOString(),
      additionalInfo: request.additionalInfo ?? "",
      assignedTutorId: request.assignedTutorId ?? "",
      assignedTutorName: request.assignedTutor?.name ?? "",
      assignedTutorEmail: request.assignedTutor?.email ?? "",
      assignedTutorContact: request.assignedTutor?.email ?? "",
      status: request.status,
      paymentStatus: request.paymentStatus,
      subject: request.subject ?? "",
      learningGoals: request.learningGoals ?? "",
      agreedSchedule: request.agreedSchedule ?? "",
      sessionDurationMinutes: request.sessionDurationMinutes,
      sessionsPerWeek: request.sessionsPerWeek,
      courseDurationWeeks: request.courseDurationWeeks,
      agreedRateCents: request.agreedRateCents,
      currency,
      paymentPlan: request.paymentPlan,
      installmentCount: request.installmentCount,
      planNotes: request.planNotes ?? "",
      planAgreedAt: request.planAgreedAt?.toISOString() ?? null,
      planAgreedByName: request.planAgreedBy?.name ?? null,
      paymentLinkEmailSentAt:
        request.paymentLinkEmailSentAt?.toISOString() ?? null,
      tutoringSessions: request.tutoringOnboardingSessions.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        status: s.status,
        scheduledStart: s.scheduledStart?.toISOString() ?? null,
        scheduledEnd: s.scheduledEnd?.toISOString() ?? null,
        durationMinutes: s.durationMinutes,
        timeZone: s.timeZone,
        subject: s.subject,
        gradeLevel: s.gradeLevel,
        tutorNotes: s.tutorNotes,
      })),
      billing: {
        totalCents,
        paidCents,
        remainingCents,
        currency,
        payments: request.tutoringPayments.map((p) => ({
          id: p.id,
          installmentNumber: p.installmentNumber,
          amountCents: p.expectedAmountCents,
          currency: (p.currency || currency).toLowerCase(),
          status: p.status,
          paidAt: p.paidAt?.toISOString() ?? null,
          emailSentAt: p.emailSentAt?.toISOString() ?? null,
        })),
      },
    };
  });
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-12">
      <header>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Tutoring requests
        </h1>
      </header>
      {requests.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No tutoring onboarding requests have been submitted yet.
        </div>
      ) : (
        <TutoringRequestTable
          requests={tableRequests}
          assignmentOptions={assignmentOptions}
        />
      )}
    </main>
  );
}
