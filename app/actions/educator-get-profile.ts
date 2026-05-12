"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface UpdateEducatorProfileData {
  name: string;
  specialty?: string | null;
  experience?: string | number | null;
  description?: string | null;
  credentialUrl?: string | null;
}

export async function updateEducatorProfile(
  userId: string,
  data: UpdateEducatorProfileData,
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        specialty: data.specialty,
        experience:
          data.experience !== "" && data.experience !== null
            ? Number(data.experience)
            : null,
        description: data.description,
        credentialUrl: data.credentialUrl,
      },
    });

    // Revalidate correct profile route
    revalidatePath(`/profile/${userId}`);

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

// "use server";

// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

// export async function updateEducatorProfile(userId: string, data: any) {
//   try {
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         name: data.name,
//         specialty: data.specialty,
//         experience:
//           data.experience !== "" && data.experience !== null
//             ? Number(data.experience)
//             : null,
//         description: data.description,
//         credentialUrl: data.credentialUrl,
//       },
//     });

//     // revalidate correct profile route
//     revalidatePath(`/profile/${userId}`);

//     return { success: true, user: updatedUser };
//   } catch (error) {
//     console.error(error);
//     return { success: false, error: "Failed to update profile" };
//   }
// }
