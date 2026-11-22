
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewAction = "approve" | "reject";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate and verify administrator permissions.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in required." },
        { status: 401 },
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (
      !admin ||
      admin.role !== "ADMIN" ||
      admin.status !== "Active" ||
      !admin.emailVerified
    ) {
      return NextResponse.json(
        { error: "Verified active administrator access required." },
        { status: 403 },
      );
    }

    // 2. Validate the requested action.
    const body = await request.json().catch(() => null);
    const action = body?.action as ReviewAction | undefined;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "A valid review action is required." },
        { status: 400 },
      );
    }

    const { id } = await context.params;

    const application = await prisma.tutorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Tutor application not found." },
        { status: 404 },
      );
    }

    if (application.status !== "Pending") {
      return NextResponse.json(
        { error: "This application has already been reviewed." },
        { status: 409 },
      );
    }

    // Prevent an administrator from reviewing their own application.
    if (
      application.userId === admin.id ||
      application.email.trim().toLowerCase() ===
        (await prisma.user.findUnique({
          where: { id: admin.id },
          select: { email: true },
        }))?.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "You cannot review your own application." },
        { status: 403 },
      );
    }

    // 3. Rejection does not modify the applicant's account.
    if (action === "reject") {
      const result = await prisma.tutorApplication.updateMany({
        where: {
          id,
          status: "Pending",
        },
        data: {
          status: "Rejected",
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });

      if (result.count !== 1) {
        return NextResponse.json(
          { error: "This application has already been reviewed." },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        status: "Rejected",
        message: "Tutor application rejected.",
      });
    }

    // 4. Prepare account creation or linking.
    const email = application.email.trim().toLowerCase();

    let applicant = application.userId
      ? await prisma.user.findUnique({
          where: { id: application.userId },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            teachingProfile: { select: { id: true } },
          },
        })
      : await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            teachingProfile: { select: { id: true } },
          },
        });

    if (application.userId && !applicant) {
      return NextResponse.json(
        { error: "The linked applicant account could not be found." },
        { status: 409 },
      );
    }

    let createdAccount = false;

    if (!applicant) {
      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        process.env.APP_URL
      )?.replace(/\/$/, "");

      if (!appUrl) {
        return NextResponse.json(
          { error: "The application URL is not configured." },
          { status: 500 },
        );
      }

      const randomPassword =
        `${randomBytes(48).toString("base64url")}Aa1!`;

      try {
        await auth.api.signUpEmail({
          body: {
            name: application.name.trim(),
            email,
            password: randomPassword,
          },
        });

        createdAccount = true;
      } catch (error) {
        console.error("Tutor applicant account creation failed.", {
          applicationId: id,
          error,
        });

        // A concurrent signup may have created this email.
        applicant = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            teachingProfile: { select: { id: true } },
          },
        });

        if (!applicant) {
          return NextResponse.json(
            { error: "Could not create the applicant account." },
            { status: 502 },
          );
        }
      }

      if (!applicant) {
        applicant = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            teachingProfile: { select: { id: true } },
          },
        });
      }

      if (!applicant) {
        return NextResponse.json(
          { error: "Applicant account could not be retrieved." },
          { status: 500 },
        );
      }
    }

    // 5. Validate the applicant account before promotion.
    if (applicant.email.trim().toLowerCase() !== email) {
      return NextResponse.json(
        { error: "The applicant account email does not match." },
        { status: 409 },
      );
    }

    if (
      applicant.role !== "LEARNER" ||
      applicant.status !== "Active" ||
      applicant.teachingProfile
    ) {
      return NextResponse.json(
        {
          error:
            "The applicant must have an active learner account without an existing teaching profile.",
        },
        { status: 409 },
      );
    }

    // Existing accounts must already have verified their email.
    // Newly created guest accounts will receive verification instructions.
    if (!createdAccount && !applicant.emailVerified) {
      return NextResponse.json(
        {
          error:
            "The applicant already has an unverified account. They must complete email verification before approval.",
        },
        { status: 409 },
      );
    }

    // 6. Atomically promote the user, create the teaching profile,
    // and mark the application approved.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.tutorApplication.updateMany({
        where: {
          id,
          status: "Pending",
        },
        data: {
          status: "Approved",
          reviewedAt: new Date(),
          reviewedById: admin.id,
          userId: applicant.id,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("APPLICATION_ALREADY_REVIEWED");
      }

      await tx.user.update({
        where: { id: applicant.id },
        data: {
          role: "TUTOR",
        },
      });

      await tx.teachingProfile.create({
        data: {
          userId: applicant.id,
          headline: application.headline,
          specialty: application.specialty,
          experience: application.experience,
          credentialUrl: application.credentialUrl,
          description: application.description,
          hourlyRate: application.hourlyRate,
          currency: application.currency,
          subjects: application.subjects ?? undefined,
          gradeLevels: application.gradeLevels ?? undefined,
          verificationStatus: "Verified",
        },
      });
    });

    // 7. Request account setup emails for newly created guest accounts.
    // Email problems must not undo an already completed approval.
    let setupEmailRequestsInitiated = false;
    let setupEmailWarning: string | undefined;

    if (createdAccount) {
      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        process.env.APP_URL
      )?.replace(/\/$/, "");

      if (appUrl) {
        try {
          await auth.api.sendVerificationEmail({
            body: {
              email,
              callbackURL: `${appUrl}/dashboard/tutor`,
            },
          });

          await auth.api.requestPasswordReset({
            body: {
              email,
              redirectTo: `${appUrl}/dashboard/tutor`,
            },
          });

          setupEmailRequestsInitiated = true;
        } catch (error) {
          console.error("Tutor account setup email request failed.", {
            applicationId: id,
            error,
          });

          setupEmailWarning =
            "The tutor was approved, but account setup emails could not be requested.";
        }
      } else {
        setupEmailWarning =
          "The tutor was approved, but the application URL is not configured for account setup emails.";
      }
    }

    return NextResponse.json({
      success: true,
      status: "Approved",
      userId: applicant.id,
      createdAccount,
      setupEmailRequestsInitiated,
      setupEmailWarning,
      message: createdAccount
        ? "Tutor application approved and account created."
        : "Tutor application approved and existing learner account promoted.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "APPLICATION_ALREADY_REVIEWED"
    ) {
      return NextResponse.json(
        { error: "This application has already been reviewed." },
        { status: 409 },
      );
    }

    console.error("Tutor application review failed:", error);

    return NextResponse.json(
      { error: "Could not complete the tutor application review." },
      { status: 500 },
    );
  }
}
