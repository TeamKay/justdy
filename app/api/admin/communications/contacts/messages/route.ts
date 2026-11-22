
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { resend } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  requestId: z.string().uuid(),
  recipientId: z.string().min(1),
  purpose: z.enum([
    "ACCOUNT_SUPPORT",
    "TUTORING_INQUIRY",
    "BOOKING",
    "PAYMENT",
    "SERVICE_UPDATE",
    "OTHER_SERVICE",
  ]),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(20000),
  serviceReason: z.string().trim().max(1000).optional(),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!admin || String(admin.role).toUpperCase() !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  if (admin.status !== "Active") {
    return {
      error: NextResponse.json(
        { error: "Your account must be active." },
        { status: 403 },
      ),
    };
  }

  return { admin };
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid message details.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      requestId,
      recipientId,
      purpose,
      subject,
      message,
      serviceReason,
    } = parsed.data;

    if (purpose === "OTHER_SERVICE" && !serviceReason?.trim()) {
      return NextResponse.json(
        {
          error: "Please provide a reason for this service message.",
        },
        { status: 400 },
      );
    }

    const recipient = await prisma.user.findFirst({
      where: {
        id: recipientId,
        role: { in: ["LEARNER", "TUTOR"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        status: true,
      },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found." },
        { status: 404 },
      );
    }

    if (recipient.status !== "Active") {
      return NextResponse.json(
        { error: "Messages can only be sent to active accounts." },
        { status: 400 },
      );
    }

    if (!recipient.emailVerified) {
      return NextResponse.json(
        {
          error:
            "This recipient's email address has not been verified. Verify the address before sending a service message.",
        },
        { status: 400 },
      );
    }

    // Create or retrieve the communication record using the
    // client-generated request ID. This protects against duplicate
    // submissions and retries using the same request ID.
    const messageRecord = await prisma.communicationMessage.upsert({
      where: {
        id: requestId,
      },
      create: {
        id: requestId,
        recipientId: recipient.id,
        senderId: authResult.admin.id,
        channel: "EMAIL",
        purpose,
        status: "PENDING",
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        subject,
        htmlContent: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
        textContent: message,
        serviceReason: serviceReason?.trim() || null,
      },
      update: {},
      select: {
        id: true,
        recipientId: true,
        senderId: true,
        recipientEmail: true,
        purpose: true,
        status: true,
        subject: true,
        textContent: true,
        serviceReason: true,
        resendMessageId: true,
      },
    });

    // A request ID must never be reused for a different message,
    // recipient, or administrator.
    if (
      messageRecord.recipientId !== recipient.id ||
      messageRecord.recipientEmail !== recipient.email ||
      messageRecord.senderId !== authResult.admin.id ||
      messageRecord.purpose !== purpose ||
      messageRecord.subject !== subject ||
      messageRecord.textContent !== message ||
      messageRecord.serviceReason !== (serviceReason?.trim() || null)
    ) {
      return NextResponse.json(
        {
          error: "This request ID has already been used for a different message.",
        },
        { status: 409 },
      );
    }

    // Do not send a message that has already been sent.
    if (messageRecord.status === "SENT") {
      return NextResponse.json({
        success: true,
        message: "This email was already sent.",
        communicationId: messageRecord.id,
        alreadySent: true,
      });
    }

    // Atomically claim the message.
    // Only one concurrent request can change PENDING or FAILED to SENDING.
    const claim = await prisma.communicationMessage.updateMany({
      where: {
        id: messageRecord.id,
        status: {
          in: ["PENDING", "FAILED"],
        },
      },
      data: {
        status: "SENDING",
        errorMessage: null,
      },
    });

    if (claim.count !== 1) {
      const latestRecord = await prisma.communicationMessage.findUnique({
        where: { id: messageRecord.id },
        select: {
          status: true,
        },
      });

      if (latestRecord?.status === "SENT") {
        return NextResponse.json({
          success: true,
          message: "This email was already sent.",
          communicationId: messageRecord.id,
          alreadySent: true,
        });
      }

      if (latestRecord?.status === "SENDING") {
        return NextResponse.json(
          {
            error: "This email is already being processed. Please wait.",
            communicationId: messageRecord.id,
            inProgress: true,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error: "Unable to claim this email for sending. Please try again.",
          communicationId: messageRecord.id,
        },
        { status: 409 },
      );
    }

    const from = `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`;

    let resendMessageId: string;

    // STEP 1: Send through Resend.
    try {
      const result = await resend.emails.send(
        {
          from,
          to: recipient.email,
          subject,
          text: message,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.6">
              <div style="padding:24px 0;border-bottom:1px solid #e5e7eb">
                <strong style="font-size:20px">Justdy</strong>
              </div>
              <div style="padding:24px 0">
                <p>Hello ${escapeHtml(recipient.name)},</p>
                <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
              </div>
              <div style="padding:16px 0;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px">
                Justdy
              </div>
            </div>
          `,
          tags: [
            {
              name: "communication_message_id",
              value: messageRecord.id,
            },
          ],
        },
        {
          idempotencyKey: `communication-message-${messageRecord.id}`,
        },
      );

      if (result.error || !result.data?.id) {
        console.error(
          "[Communication email] Resend error:",
          result.error,
        );

        // Resend returned an explicit error rather than a successful
        // acceptance response. Record the confirmed failure.
        await prisma.communicationMessage.update({
          where: { id: messageRecord.id },
          data: {
            status: "FAILED",
            errorMessage: "Resend did not confirm acceptance of the email.",
          },
        });

        return NextResponse.json(
          {
            error: "The email could not be confirmed as accepted.",
            communicationId: messageRecord.id,
          },
          { status: 502 },
        );
      }

      // Resend returned a message ID. Acceptance is now confirmed.
      resendMessageId = result.data.id;
    } catch (error) {
      console.error(
        "[Communication email] Provider outcome uncertain:",
        error,
      );

      // A thrown network/provider exception may have an ambiguous
      // outcome. Leave the message SENDING so it cannot be retried
      // automatically and accidentally delivered twice.
      return NextResponse.json(
        {
          error:
            "The email's delivery status could not be confirmed. Please investigate before retrying.",
          communicationId: messageRecord.id,
          inProgress: true,
        },
        { status: 202 },
      );
    }

    // STEP 2: Resend accepted the email.
    // Persist the successful provider response separately.
    try {
      await prisma.communicationMessage.update({
        where: { id: messageRecord.id },
        data: {
          status: "SENT",
          resendMessageId,
          sentAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      console.error(
        "[Communication email] Resend accepted email, but database status update failed:",
        {
          communicationId: messageRecord.id,
          resendMessageId,
          error,
        },
      );

      // IMPORTANT:
      // Do not mark this record FAILED.
      // Resend has already accepted the email.
      // Keeping SENDING prevents an unsafe retry.
      return NextResponse.json(
        {
          error:
            "The email was accepted by the provider, but its status could not be saved. Please investigate before retrying.",
          communicationId: messageRecord.id,
          providerAccepted: true,
        },
        { status: 202 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
      communicationId: messageRecord.id,
    });
  } catch (error) {
    console.error("[Admin communication email] Failed:", error);

    return NextResponse.json(
      { error: "Unable to process the communication request." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId");

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required." },
        { status: 400 },
      );
    }

    const recipient = await prisma.user.findFirst({
      where: {
        id: recipientId,
        role: { in: ["LEARNER", "TUTOR"] },
      },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found." },
        { status: 404 },
      );
    }

    const messages = await prisma.communicationMessage.findMany({
      where: { recipientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        purpose: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        subject: true,
        textContent: true,
        serviceReason: true,
        errorMessage: true,
        resendMessageId: true,
        sentAt: true,
        createdAt: true,
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[Admin communication history] Failed:", error);

    return NextResponse.json(
      { error: "Unable to load communication history." },
      { status: 500 },
    );
  }
}
