import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";
import { env } from "./env";

export interface User {
  id: string;
  email: string;
  role?: string;
  verificationStatus?: string;
}

export const auth = betterAuth({
  appName: "Justdy",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // --- ADD DATABASE HOOKS HERE ---
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          // 1. Check if the user is an educator and just verified their email
          if (user.role === "Educator" && user.emailVerified === true) {
            try {
              const { render } = await import("@react-email/render");
              // Replace this with your actual React Email template component for approval status
              const AwaitingApprovalEmail = (
                await import("@/app/_components/AwaitingApprovalEmail")
              ).default;

              const emailHtml = await render(
                AwaitingApprovalEmail({
                  username: user.name ?? "Educator",
                }),
              );

              // 2. Send the "Awaiting Admin Approval" email
              await resend.emails.send({
                from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
                to: user.email,
                subject: "Email Verified - Awaiting Admin Approval",
                html: emailHtml,
              });
            } catch (error) {
              console.error("Failed to send awaiting approval email:", error);
            }
          }
        },
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "Unassigned",
        input: false,
        required: false,
      },
      verificationStatus: {
        type: "string",
        defaultValue: "Pending",
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      const { render } = await import("@react-email/render");
      let emailHtml;
      const dbUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      const isEducatorApproval =
        dbUser?.role === "Educator" &&
        dbUser?.verificationStatus === "Verified";
      if (isEducatorApproval) {
        const EducatorApprovedEmail = (
          await import("@/app/_components/EducatorApprovedEmail")
        ).default;
        emailHtml = await render(
          EducatorApprovedEmail({
            username: user.name ?? "Educator",
            setupUrl: url,
          }),
        );
      } else {
        const ForgotPasswordEmail = (
          await import("@/app/_components/ForgotPasswordEmail")
        ).default;
        emailHtml = await render(
          ForgotPasswordEmail({
            username: user.name ?? "User",
            userEmail: user.email,
            resetUrl: url,
          }),
        );
      }

      await resend.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: isEducatorApproval
          ? "Your educator account has been approved"
          : "Reset your password",
        html: emailHtml,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { render } = await import("@react-email/render");

      const VerifyEmail = (await import("@/app/_components/VerifyEmail"))
        .default;
      const emailHtml = await render(
        VerifyEmail({
          username: user.name ?? "there",
          verifyUrl: url,
        }),
      );

      await resend.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Verify your account",
        html: emailHtml,
      });
    },

    autoSignInAfterVerification: false,
  },
});
