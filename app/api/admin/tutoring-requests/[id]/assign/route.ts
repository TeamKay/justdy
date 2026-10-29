import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildJustdyEmail, detailRow } from "@/lib/tutoring-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sendTutorAssignmentEmail({
  to,
  tutorName,
  studentName,
  guardianName,
  learnerEmail,
  phoneNumber,
  preferredContact,
  gradeLevel,
  potentialStartDate,
  requestId,
  additionalInfo,
}: {
  to: string;
  tutorName: string;
  studentName: string;
  guardianName: string;
  learnerEmail: string;
  phoneNumber: string;
  preferredContact: string;
  gradeLevel: string;
  potentialStartDate: string;
  requestId: string;
  additionalInfo: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_SENDER_ADDRESS?.trim();
  const fromName = process.env.EMAIL_SENDER_NAME?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    (fromAddress
      ? fromName
        ? `${fromName} <${fromAddress}>`
        : fromAddress
      : "");

  if (!apiKey || !from || !to) {
    console.error(
      "Tutor assignment email not sent: email configuration is incomplete.",
    );
    return false;
  }

  const html = buildJustdyEmail({
    preheader: "A tutoring request has been assigned to you",
    title: "A new tutoring request is yours",
    greeting: `Hello ${tutorName},`,
    message:
      "A new tutoring request has been assigned to you through Justdy. Please reach out to the learner or their guardian to introduce yourself, discuss their learning needs, and begin planning the tutoring sessions.",
    contentHtml: `
      <table role="presentation" width="100%" cellspacing="0"
        cellpadding="0"
        style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;">
        ${detailRow("Request reference", requestId)}
        ${detailRow("Learner", studentName)}
        ${detailRow("Guardian", guardianName)}
        ${detailRow("Learner/guardian email", learnerEmail)}
        ${detailRow("Phone number", phoneNumber)}
        ${detailRow("Preferred contact", preferredContact)}
        ${detailRow("Grade level", gradeLevel)}
        ${detailRow("Potential start date", potentialStartDate)}
        ${detailRow("Additional information", additionalInfo)}
      </table>
    `,
    footerNote:
      "Next step: contact the learner or guardian to discuss goals, availability, and a suitable tutoring plan. Do not initiate payment until the tutoring plan has been agreed.",
  });

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Justdy tutoring assignment: ${studentName}`,
      text: [
        `Hello ${tutorName},`,
        "",
        "A new tutoring request has been assigned to you.",
        "Please contact the learner or guardian to discuss their learning needs and begin planning.",
        "",
        `Request reference: ${requestId}`,
        `Learner: ${studentName}`,
        `Guardian: ${guardianName}`,
        `Email: ${learnerEmail}`,
        `Phone: ${phoneNumber}`,
        `Preferred contact: ${preferredContact}`,
        `Grade level: ${gradeLevel}`,
        `Potential start date: ${potentialStartDate}`,
        `Additional information: ${additionalInfo || "Not provided"}`,
        "",
        "Please agree on the tutoring plan before initiating payment.",
        "Justdy",
      ].join("\n"),
      html,
    });

    if (error || !data?.id) {
      console.error("Tutor assignment email error:", error);
      return false;
    }

    console.info("Tutor assignment email accepted by Resend:", data.id);
    return true;
  } catch (error) {
    console.error("Tutor assignment email failed:", error);
    return false;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      emailVerified: true,
      status: true,
    },
  });

  if (!actor || String(actor.role).toUpperCase() !== "ADMIN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }

  if (!actor.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before managing requests." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("tutorId" in body)) {
    return NextResponse.json(
      { error: "Provide a tutorId or null to unassign." },
      { status: 400 },
    );
  }

  const tutorId = (body as { tutorId: unknown }).tutorId;

  if (tutorId !== null && (typeof tutorId !== "string" || !tutorId.trim())) {
    return NextResponse.json({ error: "Invalid tutorId." }, { status: 400 });
  }

  const existing = await prisma.tutoringOnboardingRequest.findUnique({
    where: { id },
    select: {
      id: true,
      assignedTutorId: true,
      studentName: true,
      guardianName: true,
      email: true,
      phoneNumber: true,
      preferredContact: true,
      gradeLevel: true,
      potentialStartDate: true,
      additionalInfo: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Tutoring request not found." },
      { status: 404 },
    );
  }

  let selectedTutor: { id: string; name: string; email: string } | null = null;

  if (tutorId !== null) {
    const isAdminSelfAssignment =
      tutorId === actor.id && actor.status === "Active" && actor.emailVerified;

    if (isAdminSelfAssignment) {
      const admin = await prisma.user.findUnique({
        where: { id: actor.id },
        select: { id: true, name: true, email: true },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Could not find the administrator account." },
          { status: 400 },
        );
      }

      selectedTutor = admin;
    } else {
      const eligibleTutor = await prisma.user.findFirst({
        where: {
          id: tutorId as string,
          role: "TUTOR",
          status: "Active",
          emailVerified: true,
          teachingProfile: { is: { verificationStatus: "Verified" } },
        },
        select: { id: true, name: true, email: true },
      });

      if (!eligibleTutor) {
        return NextResponse.json(
          {
            error:
              "Choose yourself as the administrator or choose an active, verified tutor with a verified teaching profile.",
          },
          { status: 400 },
        );
      }

      selectedTutor = eligibleTutor;
    }
  }

  // Save first. Email delivery must never undo a successful assignment.
  const updated = await prisma.tutoringOnboardingRequest.update({
    where: { id },
    data: { assignedTutorId: selectedTutor?.id ?? null },
    select: { id: true, assignedTutorId: true },
  });

  const assignmentChanged =
    existing.assignedTutorId !== updated.assignedTutorId;

  let tutorEmailSent: boolean | null = null;

  if (assignmentChanged && selectedTutor) {
    tutorEmailSent = await sendTutorAssignmentEmail({
      to: selectedTutor.email,
      tutorName: selectedTutor.name,
      studentName: existing.studentName,
      guardianName: existing.guardianName,
      learnerEmail: existing.email,
      phoneNumber: existing.phoneNumber,
      preferredContact: existing.preferredContact,
      gradeLevel: existing.gradeLevel,
      potentialStartDate: existing.potentialStartDate
        ? existing.potentialStartDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Not specified",
      requestId: existing.id,
      additionalInfo: existing.additionalInfo,
    });
  }

  const message =
    tutorEmailSent === true
      ? "Tutor assignment saved. The tutor notification email was sent."
      : tutorEmailSent === false
        ? "Tutor assignment saved, but the tutor notification email could not be sent. Please check the server logs."
        : "Tutor assignment saved.";

  return NextResponse.json({
    success: true,
    request: updated,
    tutorEmailSent,
    message,
  });
}
