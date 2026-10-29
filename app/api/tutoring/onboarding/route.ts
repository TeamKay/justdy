import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OnboardingPayload = {
  gradeLevel?: unknown;
  studentName?: unknown;
  guardianName?: unknown;
  enrollmentType?: unknown;
  learnerEmail?: unknown;
  preferredCallDateTime?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  preferredContact?: unknown;
  additionalInfo?: unknown;
};

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

type BrandedEmailOptions = {
  preheader: string;
  title: string;
  greeting: string;
  message: string;
  contentHtml?: string;
  footerNote?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detailRow(label: string, value: unknown): string {
  return `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e8edf4;
        color:#64748b;font-size:13px;width:40%;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8edf4;
        color:#172033;font-size:14px;font-weight:600;
        overflow-wrap:anywhere;">
        ${escapeHtml(value || "Not provided")}
      </td>
    </tr>`;
}

function buildJustdyEmail(options: BrandedEmailOptions): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;
  font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(options.preheader)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0"
          cellpadding="0"
          style="width:100%;max-width:600px;background:#ffffff;
          border-radius:14px;overflow:hidden;">

          <tr>
            <td style="background:#102c54;padding:30px 32px 28px;">
              <div style="font-size:27px;font-weight:800;
                letter-spacing:-1px;color:#ffffff;">
                justdy<span style="color:#60a5fa;">.</span>
              </div>
              <div style="padding-top:8px;font-size:11px;
                letter-spacing:2px;font-weight:700;color:#cbdcf5;">
                PERSONALIZED LEARNING
              </div>
              <div style="margin-top:24px;height:3px;width:54px;
                background:#60a5fa;border-radius:4px;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 12px;">
              <div style="font-size:12px;font-weight:700;
                letter-spacing:1.4px;color:#2563eb;
                text-transform:uppercase;">
                ${escapeHtml(options.preheader)}
              </div>
              <h1 style="font-size:27px;line-height:1.3;
                letter-spacing:-0.6px;color:#102c54;
                margin:12px 0 20px;">
                ${escapeHtml(options.title)}
              </h1>
              <p style="font-size:15px;line-height:1.8;
                color:#334155;margin:0 0 14px;">
                ${escapeHtml(options.greeting)}
              </p>
              <p style="font-size:15px;line-height:1.8;
                color:#475569;margin:0 0 24px;">
                ${escapeHtml(options.message)}
              </p>
            </td>
          </tr>

          ${
            options.contentHtml
              ? `<tr><td style="padding:0 32px 24px;">
                  ${options.contentHtml}
                </td></tr>`
              : ""
          }

          <tr>
            <td style="padding:0 32px 32px;">
              <div style="background:#eff6ff;border-left:4px solid #2563eb;
                padding:16px 18px;border-radius:5px;">
                <p style="font-size:14px;line-height:1.7;
                  color:#1e3a5f;margin:0;">
                  ${escapeHtml(
                    options.footerNote ||
                      "If you have questions, please reply to this email.",
                  )}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e8edf4;
              padding:24px 32px;">
              <div style="font-size:15px;font-weight:700;color:#102c54;">
                Justdy
              </div>
              <p style="font-size:12px;line-height:1.7;
                color:#64748b;margin:8px 0 0;">
                Supporting your learning journey, one step at a time.
              </p>
              <p style="font-size:11px;line-height:1.6;
                color:#94a3b8;margin:16px 0 0;">
                This email relates to a tutoring request submitted through
                Justdy. Please keep it for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendNotificationEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
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
      "Email not sent: RESEND_API_KEY, EMAIL_FROM, or recipient is missing.",
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });

    if (error || !data?.id) {
      console.error("Resend email error:", error);
      return false;
    }

    console.info("Email accepted by Resend:", data.id);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

export async function POST(request: Request) {
  let body: OnboardingPayload;

  try {
    body = (await request.json()) as OnboardingPayload;
  } catch {
    return NextResponse.json(
      {
        error:
          "The submitted information was not valid JSON. Please try again.",
      },
      { status: 400 },
    );
  }

  const gradeLevel = cleanString(body.gradeLevel, 80);
  const studentName = cleanString(body.studentName, 160);
  const guardianName = cleanString(body.guardianName, 160);
  const enrollmentType = cleanString(body.enrollmentType, 40) || "self";
  const learnerEmail = cleanString(body.learnerEmail, 254).toLowerCase();
  const email = cleanString(body.email, 254).toLowerCase();
  const phoneNumber = cleanString(body.phoneNumber, 50);
  const preferredContact = cleanString(body.preferredContact, 30) || "Email";
  const additionalInfo = cleanString(body.additionalInfo, 5000);
  const preferredCallDateTimeText = cleanString(body.preferredCallDateTime, 40);

  if (
    !gradeLevel ||
    !studentName ||
    !guardianName ||
    !email ||
    !phoneNumber ||
    !preferredCallDateTimeText
  ) {
    return NextResponse.json(
      { error: "Please complete all required onboarding fields." },
      { status: 400 },
    );
  }

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please provide a valid contact email address." },
      { status: 400 },
    );
  }

  if (!["self", "parent_guardian", "other_person"].includes(enrollmentType)) {
    return NextResponse.json(
      { error: "Please choose who the tutoring request is for." },
      { status: 400 },
    );
  }

  if (learnerEmail && !isValidEmail(learnerEmail)) {
    return NextResponse.json(
      {
        error:
          "Please provide a valid learner email address, or leave it blank.",
      },
      { status: 400 },
    );
  }

  const potentialStartDate = new Date(preferredCallDateTimeText);

  if (
    Number.isNaN(potentialStartDate.getTime()) ||
    potentialStartDate.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: "Please choose a valid future date and time for the call." },
      { status: 400 },
    );
  }

  try {
    // 1. Save the request before attempting to send emails.
    // No checkout session or payment is created here.
    const intake = await prisma.tutoringOnboardingRequest.create({
      data: {
        gradeLevel,
        studentName,
        guardianName,
        enrollmentType,
        potentialStartDate,
        email,
        learnerEmail: learnerEmail || null,
        billingEmail: null,
        phoneNumber,
        preferredContact,
        additionalInfo: additionalInfo || null,
        status: "pending_planning",
        paymentStatus: "not_requested",
      },
      select: { id: true },
    });

    const adminEmail = process.env.ADMIN_EMAIL?.trim();

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(potentialStartDate);

    // 2. Send the learner/contact-person confirmation.
    const contactEmailPromise = sendNotificationEmail({
      to: email,
      subject: "We received your Justdy tutoring request",
      text: `Hello ${guardianName},

Thank you for contacting Justdy about tutoring for ${studentName}.

Your tutoring request has been received successfully.

Request reference: ${intake.id}

Here is a summary of your request:
- Learner: ${studentName}
- Grade level: ${gradeLevel}
- Preferred call date and time: ${formattedDate}
- Preferred contact method: ${preferredContact}

What happens next?
Our team will review the information and contact you to discuss the learner's needs, a suitable tutoring plan, and scheduling.

Your request is not yet a confirmed booking. No payment has been taken or requested. We will provide a secure payment link only after the tutoring plan has been agreed upon.

If you have additional questions, please reply to this email.

Thank you,
The Justdy Team`,
      html: buildJustdyEmail({
        preheader: "Tutoring request received",
        title: "Your learning journey starts here",
        greeting: `Hello ${guardianName},`,
        message:
          "Thank you for choosing Justdy. We have received your tutoring request and saved your details. Our team will review your request and follow up to discuss a tutoring plan that suits your learning needs.",
        contentHtml: `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;
      border-radius:10px;padding:20px;">
      <div style="font-size:12px;color:#64748b;
        text-transform:uppercase;letter-spacing:1px;">
        Request reference
      </div>
      <div style="font-size:21px;font-weight:700;
        color:#102c54;margin-top:8px;">
        ${escapeHtml(intake.id)}
      </div>
      <div style="margin-top:18px;display:inline-block;
        background:#dcfce7;color:#166534;padding:7px 11px;
        border-radius:20px;font-size:12px;font-weight:700;">
        REQUEST RECEIVED
      </div>
    </div>
  `,
        footerNote:
          "Our team will contact you to discuss the tutoring plan. No payment has been initiated by this request.",
      }),
    });

    // 3. Send a separate notification to the administrator.
    const adminEmailPromise = adminEmail
      ? sendNotificationEmail({
          to: adminEmail,
          subject: `New tutoring request: ${studentName}`,
          text: `A new tutoring service request has been submitted through Justdy.

Request reference: ${intake.id}

LEARNER INFORMATION
- Learner name: ${studentName}
- Learner email: ${learnerEmail || "Not provided yet"}
- Enrollment type: ${enrollmentType}
- Grade level: ${gradeLevel}
- Preferred call date and time: ${formattedDate}

CONTACT INFORMATION
- Contact person: ${guardianName}
- Contact email: ${email}
- Phone: ${phoneNumber}
- Preferred contact method: ${preferredContact}

ADDITIONAL INFORMATION
${additionalInfo || "No additional information provided."}

REQUEST STATUS
- Status: pending_planning
- Payment status: not_requested

Please review this request and contact the requester to discuss the tutoring plan.

This request has been saved in the Justdy system. No payment has been initiated.`,
          html: buildJustdyEmail({
            preheader: "New tutoring request requires review",
            title: "New tutoring request",
            greeting: "Hello Justdy team,",
            message:
              "A new tutoring request has been submitted. Review the details below and contact the requester to discuss the tutoring plan.",
            contentHtml: `
    <table role="presentation" width="100%" cellspacing="0"
      cellpadding="0"
      style="border:1px solid #e2e8f0;border-radius:10px;
      overflow:hidden;border-collapse:separate;">
      ${detailRow("Request reference", intake.id)}
      ${detailRow("Student name", studentName)}
      ${detailRow("Enrollment type", enrollmentType)}
      ${detailRow("Contact person", guardianName)}
      ${detailRow("Contact email", email)}
      ${detailRow("Learner email", learnerEmail || "Not provided yet")}
      ${detailRow("Phone number", phoneNumber)}
      ${detailRow("Preferred contact", preferredContact)}
      ${detailRow("Grade level", gradeLevel)}
      ${detailRow("Preferred call date and time", formattedDate)}
      ${detailRow("Request status", "Pending planning")}
      ${detailRow("Payment status", "Not requested")}
      ${detailRow("Additional information", additionalInfo)}
    </table>
  `,
            footerNote:
              "Please review this request and contact the requester to agree on the tutoring plan. This request has not initiated a payment.",
          }),
        })
      : Promise.resolve(false);

    // Each email is attempted independently. A failure in one does not
    // prevent the other from being attempted.
    const [emailConfirmationSent, adminNotificationSent] = await Promise.all([
      contactEmailPromise,
      adminEmailPromise,
    ]);

    let message = "Your tutoring request has been received.";

    if (emailConfirmationSent && adminNotificationSent) {
      message =
        "Your request has been submitted, and both confirmation and admin notification emails were sent successfully.";
    } else if (emailConfirmationSent) {
      message =
        "Your request has been submitted and your confirmation email was sent. Our team notification email could not be sent automatically.";
    } else if (adminNotificationSent) {
      message =
        "Your request has been submitted and our team has been notified. Your confirmation email could not be sent automatically.";
    } else {
      message =
        "Your request has been saved, but the emails could not be sent automatically. Our team may need to follow up with you.";
    }

    return NextResponse.json(
      {
        success: true,
        requestId: intake.id,
        emailConfirmationSent,
        adminNotificationSent,
        message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/tutoring/onboarding failed:", error);

    return NextResponse.json(
      {
        error:
          "We couldn't save your onboarding request right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
