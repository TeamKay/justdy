import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const resendSchema = z.object({
  email: z.string().trim().email().max(254),
});

const genericResponse = {
  message:
    "If this account needs email verification, a verification email will be sent shortly.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    // Keep the response identical for unknown and already-verified accounts.
    if (!user || user.emailVerified) {
      return NextResponse.json(genericResponse, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      process.env.APP_URL ||
      request.nextUrl.origin
    ).replace(/\/$/, "");

    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: `${appUrl}/verification-success`,
      },
    });

    return NextResponse.json(genericResponse, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("RESEND VERIFICATION REQUEST FAILED:", error);

    // Do not reveal whether an account exists or expose internal errors.
    return NextResponse.json(genericResponse, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
