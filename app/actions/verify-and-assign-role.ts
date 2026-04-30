"use server";

import { auth } from "@/lib/auth";

export async function verifyAndAssignRole(email: string, otp: string) {
  // 1. Verify the Email OTP
  await auth.api.verifyEmailOTP({ body: { email, otp } });
  return { success: true };
}
