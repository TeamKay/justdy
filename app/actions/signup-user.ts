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
  const role = (formData as { role?: string })?.role || "Learner";

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        facilitatorProfile: true,
      },
    });

    if (existingUser) {
      if (
        existingUser.emailVerified &&
        existingUser.facilitatorProfile?.verificationStatus === "Pending"
      ) {
        return { ok: false, type: "awaiting_admin_approval" };
      }

      if (existingUser.emailVerified) {
        return { ok: false, type: "exists_verified" };
      }

      return { ok: false, type: "exists_unverified" };
    }

    // 2. Call Better Auth to create base User and Account
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,

        callbackURL: `/onboarding?role=${role.toLowerCase()}`,
      },
    });

    if (!result?.user) {
      return { ok: false, type: "signup_failed" };
    }

    // 3. Assign Role in UserRole join table
    const targetRole = await prisma.role.findUnique({
      where: { name: role },
    });

    if (targetRole) {
      await prisma.userRole.create({
        data: {
          userId: result.user.id,
          roleId: targetRole.id,
        },
      });
    }

    return { ok: true, type: "created" };
  } catch (error) {
    console.error("Signup error:", error);
    return { ok: false, type: "signup_failed" };
  }
}

// "use server";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { signupSchema } from "@/lib/zodSchemas";

// export async function signupUser(formData: unknown) {
//   const parsed = signupSchema.safeParse(formData);

//   if (!parsed.success) {
//     return {
//       ok: false,
//       type: "invalid_data",
//     };
//   }

//   const { name, email, password } = parsed.data;

//   try {
//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (existingUser) {
//       if (
//         existingUser.emailVerified &&
//         existingUser.verificationStatus === "Pending"
//       ) {
//         return {
//           ok: false,
//           type: "awaiting_admin_approval",
//         };
//       }

//       if (existingUser.emailVerified) {
//         return {
//           ok: false,
//           type: "exists_verified",
//         };
//       }

//       return {
//         ok: false,
//         type: "exists_unverified",
//       };
//     }

//     const result = await auth.api.signUpEmail({
//       body: {
//         name,
//         email,
//         password,
//         callbackURL: "/onboarding",
//       },
//     });

//     if (!result?.user) {
//       return {
//         ok: false,
//         type: "signup_failed",
//       };
//     }

//     return {
//       ok: true,
//       type: "created",
//     };
//   } catch (error) {
//     console.error(error);

//     return {
//       ok: false,
//       type: "signup_failed",
//     };
//   }
// }

// "use server";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { signupSchema } from "@/lib/zodSchemas";

// export async function signupUser(formData: unknown) {
//   const parsed = signupSchema.safeParse(formData);

//   if (!parsed.success) {
//     return { ok: false, type: "invalid_data" };
//   }

//   const { name, email, password } = parsed.data;

//   try {
//     // 1. CHECK IF USER EXISTS FIRST
//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (existingUser) {
//       // If already exists but not verified → resend OTP
//       if (!existingUser.emailVerified) {
//         await auth.api.sendVerificationOTP({
//           body: { email, type: "sign-in" },
//         });

//         return {
//           ok: true,
//           type: "exists_unverified",
//         };
//       }

//       // Already verified user
//       return {
//         ok: false,
//         type: "exists_verified",
//       };
//     }

//     // 2. CREATE USER
//     const result = await auth.api.signUpEmail({
//       body: { name, email, password },
//     });

//     if (!result || !result.user) {
//       return { ok: false, type: "signup_failed" };
//     }

//     return {
//       ok: true,
//       type: "created",
//     };
//   } catch (error) {
//     // Crucial for debugging your API calls locally
//     console.error("Signup Flow Error Details:", error);
//     return { ok: false, type: "signup_failed" };
//   }
// }
