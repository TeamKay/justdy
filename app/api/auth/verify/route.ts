import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // Base fallback URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=MissingToken`);
  }

  try {
    // 1. Locate the token inside your database
    const verificationRecord = await prisma.verification.findFirst({
      where: { value: token },
    });

    // 2. Guard clause: Ensure token exists and hasn't expired yet
    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=InvalidOrExpiredToken`,
      );
    }

    // 3. Update the matching user and delete/consume the validation token record
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationRecord.identifier },
        data: {
          emailVerified: true,
          verificationStatus: "Verified", // Updating onboarding status automatically
        },
      }),
      prisma.verification.delete({
        where: { id: verificationRecord.id },
      }),
    ]);

    // 4. Send them directly into the application with a success toast notification
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=true`);
  } catch (error) {
    console.error("❌ Email verification routine crashed:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=InternalServerError`);
  }
}
