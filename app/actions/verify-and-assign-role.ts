"use server";

import { auth } from "@/lib/auth";

export async function sendPasswordReset(email: string) {
  await auth.api.requestPasswordReset({
    body: {
      email,
      redirectTo: "/reset-password",
    },
  });

  return { success: true };
}

// "use server";

// import { auth } from "@/lib/auth";

// export async function verifyAndAssignRole(email: string, otp: string) {
//   // 1. Verify the Email OTP
//   await auth.api.verifyEmailOTP({ body: { email, otp } });
//   return { success: true };
// }
