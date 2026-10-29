import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TutoringPlanEditor from "@/app/_components/Tutoring-plan-editor";

export const dynamic = "force-dynamic";

export default async function TutorTutoringRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth?mode=signin");

  const tutor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      emailVerified: true,
      teachingProfile: { select: { verificationStatus: true } },
    },
  });
  if (!tutor || String(tutor.role).toUpperCase() !== "TUTOR")
    redirect("/dashboard");
  if (!tutor.emailVerified)
    redirect(
      `/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`,
    );
  if (
    tutor.status !== "Active" ||
    tutor.teachingProfile?.verificationStatus !== "Verified"
  )
    redirect("/educator");

  // Security boundary: the query itself restricts results to this authenticated tutor.
  const requests = await prisma.tutoringOnboardingRequest.findMany({
    where: { assignedTutorId: tutor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      gradeLevel: true,
      studentName: true,
      guardianName: true,
      potentialStartDate: true,
      email: true,
      phoneNumber: true,
      preferredContact: true,
      additionalInfo: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      subject: true,
      learningGoals: true,
      agreedSchedule: true,
      sessionDurationMinutes: true,
      sessionsPerWeek: true,
      agreedRateCents: true,
      currency: true,
      planNotes: true,
      planAgreedAt: true,
      planAgreedBy: { select: { name: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Teaching workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Assigned tutoring requests
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only requests assigned to your tutor account appear here. Payment is
          not requested until the tutoring plan is agreed.
        </p>
      </header>
      {requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="font-semibold">No assigned requests yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When an administrator assigns a tutoring request to you, it will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold">
                    {request.studentName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.gradeLevel} · Submitted{" "}
                    {request.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    {request.status.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                    Payment: {request.paymentStatus.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Detail
                  label="Parent / guardian"
                  value={request.guardianName}
                />
                <Detail label="Email" value={request.email} />
                <Detail label="Phone" value={request.phoneNumber} />
                <Detail
                  label="Preferred contact"
                  value={request.preferredContact}
                />
                <Detail
                  label="Potential start date"
                  value={request.potentialStartDate.toLocaleDateString()}
                />
              </dl>
              {request.additionalInfo && (
                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Additional information
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {request.additionalInfo}
                  </p>
                </div>
              )}
              <TutoringPlanEditor
                requestId={request.id}
                initial={{
                  subject: request.subject ?? "",
                  learningGoals: request.learningGoals ?? "",
                  agreedSchedule: request.agreedSchedule ?? "",
                  sessionDurationMinutes: request.sessionDurationMinutes,
                  sessionsPerWeek: request.sessionsPerWeek,
                  agreedRateCents: request.agreedRateCents,
                  currency: request.currency,
                  planNotes: request.planNotes ?? "",
                  status: request.status,
                  paymentStatus: request.paymentStatus,
                  planAgreedAt: request.planAgreedAt?.toISOString() ?? null,
                  planAgreedByName: request.planAgreedBy?.name ?? null,
                }}
                guardianEmail={request.email}
                initialLearnerEmail={request.email}
                initialBillingEmail={request.email}
                learnerUserId={null}
                setupSentAt={null}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
