"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3 } from "@/lib/S3Client";
import { env } from "@/lib/env";

export async function uploadProfileImage(userId: string, file: File) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `profiles/${userId}-${Date.now()}.png`;

    await S3.send(
      new PutObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // construct public URL

    const imageUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${fileName}`;

    // save to DB
    await prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
    });

    revalidatePath(`/profile/${userId}`);

    return { success: true, imageUrl };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Upload failed" };
  }
}
