"use server";

import { requireEducator } from "@/app/actions/require-educator";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { deleteFromS3 } from "@/lib/s3";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireEducator();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: decision.reason.isRateLimit()
          ? "Too many requests. Try again later."
          : "Request blocked.",
      };
    }

    // ✅ 1. Get course first
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { fileKey: true },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // ✅ 2. Delete file from S3
    if (course.fileKey) {
      await deleteFromS3(course.fileKey);
    }

    // ✅ 3. Delete course from DB
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath("/educator/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.error("Delete error:", error);

    return {
      status: "error",
      message: "Failed to delete Course!",
    };
  }
}

// "use server";

// import { requireEducator } from "@/app/actions/require-educator";
// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";

// import { ApiResponse } from "@/lib/types";
// import { request } from "@arcjet/next";
// import { revalidatePath } from "next/cache";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// export async function deleteCourse(courseId: string): Promise<ApiResponse> {
//   const session = await requireEducator();

//   try {
//     const req = await request();
//     const decision = await aj.protect(req, {
//       fingerprint: session.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message:
//             "You have exceeded the number of allowed requests. Please try again later.",
//         };
//       } else {
//         return {
//           status: "error",
//           message:
//             "You are a bot! If this is a mistake, please contact support.",
//         };
//       }
//     }
//     await prisma.course.delete({
//       where: {
//         id: courseId,
//       },
//     });

//     revalidatePath("/educator/courses");

//     return {
//       status: "success",
//       message: "Course deleted successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete Course!",
//     };
//   }
// }
