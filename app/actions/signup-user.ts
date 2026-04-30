"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { signupSchema } from "@/lib/zodSchemas";

export async function signupUser(formData: unknown) {
  const parsed = signupSchema.safeParse(formData);

  if (!parsed.success) {
    return { ok: false, type: "invalid_data" };
  }

  const { name, email, password } = parsed.data;

  try {
    // 1. CHECK IF USER EXISTS FIRST
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If already exists but not verified → resend OTP
      if (!existingUser.emailVerified) {
        await auth.api.sendVerificationOTP({
          body: { email, type: "email-verification" },
        });

        return {
          ok: true,
          type: "exists_unverified",
        };
      }

      // Already verified user
      return {
        ok: false,
        type: "exists_verified",
      };
    }

    // 2. CREATE USER
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!result.user) {
      return { ok: false, type: "signup_failed" };
    }

    // 4. Send OTP
    await auth.api.sendVerificationOTP({
      body: { email, type: "email-verification" },
    });

    return {
      ok: true,
      type: "created",
    };
  } catch (error) {
    throw new Error("Server Error" + error);
  }
}

// "use server";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { signupSchema } from "@/lib/zodSchemas";

// export async function signupUser(formData: unknown) {
//   // Validate form data
//   const parsed = signupSchema.safeParse(formData);
//   if (!parsed.success) {
//      throw new Error("Invalid form data");
//   }

//   const { name, email, password, roleIntent } = parsed.data;

//   try {
//     // Create user account
//     const result = await auth.api.signUpEmail({
//       body: { name, email, password },
//     });

//     if (!result.user) {
//       throw new Error("Signup failed");
//     }
//  // Save role intent and create initial credit transaction
//    await prisma.$transaction(async (tx) => {

//     await tx.roleIntent.create({
//       data: { email, role: roleIntent },
//     });

//   });

//     // 5️⃣ Send OTP for email verification
//     await auth.api.sendVerificationOTP({
//       body: { email, type: "email-verification" },
//     });

//     return { success: true };
//   } catch (err: unknown) {
//   // First, check if err is an Error
//   if (err instanceof Error) {
//     throw new Error(err.message);
//   }

//   // If it might be a Better Auth API error object
//   const maybeApiError = err as { response?: { data?: { code?: string; message?: string } } };
//   if (maybeApiError.response?.data?.code === "USER_ALREADY_EXISTS") {
//     throw new Error("User already exists");
//   }

//   throw new Error("Signup failed");
// }
// }
