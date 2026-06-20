import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { resend } from "./resend";
import { env } from "./env";

export interface User {
  id: string;
  email: string;
  role?: string;
}

export const auth = betterAuth({
  appName: "Justdy",

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
      const ForgotPasswordEmail = (
        await import("@/app/_components/ForgotPasswordEmail")
      ).default;

      const emailHtml = await render(
        ForgotPasswordEmail({
          username: user.name ?? "User",
          userEmail: user.email,
          resetUrl: url,
        }),
      );

      await resend.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Reset your Justdy password",
        html: emailHtml,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);

      verificationUrl.searchParams.set(
        "callbackURL",
        `${env.BETTER_AUTH_URL}/onboarding`,
      );

      const finalUrl = verificationUrl.toString();

      await resend.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Verify your Justdy Account",

        html: `
      <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:40px">
        <div style="max-width:600px;margin:auto;background:white;padding:40px;border-radius:12px">

          <h1 style="text-align:center;color:#2563eb">
            Welcome to Justdy
          </h1>

          <p style="font-size:16px;color:#333">
            Thank you for creating an account.
          </p>

          <p style="font-size:16px;color:#333">
            Click the button below to verify your email address.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a
              href="${finalUrl}"
              style="
                background:#2563eb;
                color:white;
                text-decoration:none;
                padding:14px 24px;
                border-radius:8px;
                display:inline-block;
                font-weight:bold;
              "
            >
              Verify Email
            </a>
          </div>

          <p style="font-size:14px;color:#666">
            If the button doesn't work, copy and paste this link:
          </p>

          <p style="word-break:break-all;color:#2563eb">
            ${finalUrl}
          </p>

          <hr style="margin:30px 0" />

          <p style="font-size:12px;color:#999;text-align:center">
            © ${new Date().getFullYear()} Justdy
          </p>

        </div>
      </div>
      `,
      });
    },

    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
});

// import { betterAuth } from "better-auth";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// import prisma from "./prisma";
// import { resend } from "./resend";
// import { env } from "./env";

// export interface User {
//   id: string;
//   email: string;
//   role?: string;
// }

// export const auth = betterAuth({
//   appName: "Justdy",

//   database: prismaAdapter(prisma, {
//     provider: "postgresql",
//   }),

//   user: {
//     additionalFields: {
//       role: {
//         type: "string",
//         defaultValue: "Unassigned",
//         input: false,
//         required: false,
//       },
//       verificationStatus: {
//         type: "string",
//         defaultValue: "Pending",
//       },
//     },
//   },

//   emailAndPassword: {
//     enabled: true,
//     autoSignIn: false,
//     minPasswordLength: 8,
//     maxPasswordLength: 20,
//     requireEmailVerification: true,
//   },

//   emailVerification: {
//     sendVerificationEmail: async ({ user, url }) => {
//       const verificationUrl = new URL(url);

//       verificationUrl.searchParams.set(
//         "callbackURL",
//         `${env.BETTER_AUTH_URL}/onboarding`,
//       );

//       const finalUrl = verificationUrl.toString();

//       await resend.emails.send({
//         from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
//         to: user.email,
//         subject: "Verify your Justdy Account",

//         html: `
//       <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:40px">
//         <div style="max-width:600px;margin:auto;background:white;padding:40px;border-radius:12px">

//           <h1 style="text-align:center;color:#2563eb">
//             Welcome to Justdy
//           </h1>

//           <p style="font-size:16px;color:#333">
//             Thank you for creating an account.
//           </p>

//           <p style="font-size:16px;color:#333">
//             Click the button below to verify your email address.
//           </p>

//           <div style="text-align:center;margin:32px 0">
//             <a
//               href="${finalUrl}"
//               style="
//                 background:#2563eb;
//                 color:white;
//                 text-decoration:none;
//                 padding:14px 24px;
//                 border-radius:8px;
//                 display:inline-block;
//                 font-weight:bold;
//               "
//             >
//               Verify Email
//             </a>
//           </div>

//           <p style="font-size:14px;color:#666">
//             If the button doesn't work, copy and paste this link:
//           </p>

//           <p style="word-break:break-all;color:#2563eb">
//             ${finalUrl}
//           </p>

//           <hr style="margin:30px 0" />

//           <p style="font-size:12px;color:#999;text-align:center">
//             © ${new Date().getFullYear()} Justdy
//           </p>

//         </div>
//       </div>
//       `,
//       });
//     },

//     sendOnSignUp: true,
//     autoSignInAfterVerification: true,
//   },
// });
