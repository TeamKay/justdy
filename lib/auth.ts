import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";
import { emailOTP } from "better-auth/plugins";

// @/lib/auth.ts

export interface User {
  id: string;
  email: string;
  role?: string;
  // ... other fields
}

export const auth = betterAuth({
  appName: "better_auth_nextjs",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

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
        defaultValue: "Pending", // Adjust default as needed
      },
      credits: {
        type: "number",
        defaultValue: 0,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: false, //It does not allow user to login without email verification [!code highlight]
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: "Justdy <onboarding@resend.dev>",
          to: email,
          subject: "Verify your Justdy Account",
          html: `
      <div style="font-family: Arial, sans-serif; background-color: #edeff5; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          
          <h2 style="color: #1d4ed8; text-align: center;">Welcome to LearnSmat!</h2>
          <p style="font-size: 16px; color: #333333; text-align: center;">
            Use the OTP below to verify your email address and activate your account.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; background: #e0f2fe; padding: 10px 20px; border-radius: 6px; letter-spacing: 2px; color: #1d4ed8;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 14px; color: #555555; text-align: center;">
            This OTP is valid for 10 minutes. Do not share it with anyone.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

          <p style="font-size: 12px; color: #999999; text-align: center;">
            LearnSmat Inc.<br/>
            123 Learning St, Knowledge City<br/>
            &copy; ${new Date().getFullYear()} LearnSmat. All rights reserved.
          </p>
        </div>
      </div>
      `,
        });
      },
    }),
  ],
});
