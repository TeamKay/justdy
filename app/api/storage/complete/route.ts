import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyR2Upload } from "@/lib/storage/r2";

export const runtime = "nodejs";

type UploadPurpose = "SOCIAL_POST" | "PROFILE_IMAGE";

function isUploadPurpose(value: unknown): value is UploadPurpose {
  return value === "SOCIAL_POST" || value === "PROFILE_IMAGE";
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in before completing an upload." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid upload completion request." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    if (
      !isUploadPurpose(input.purpose) ||
      typeof input.key !== "string" ||
      typeof input.fileName !== "string" ||
      typeof input.mimeType !== "string" ||
      typeof input.sizeBytes !== "number" ||
      !Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid uploaded file information." },
        { status: 400 },
      );
    }

    const fileName = input.fileName.trim();
    const mimeType = input.mimeType.trim().toLowerCase();

    if (!fileName || fileName.length > 255 || !mimeType) {
      return NextResponse.json(
        { error: "Invalid file name or MIME type." },
        { status: 400 },
      );
    }

    const verified = await verifyR2Upload({
      key: input.key,
      userId: session.user.id,
      purpose: input.purpose,
      expectedSize: input.sizeBytes,
      expectedMimeType: mimeType,
    });

    if (
      input.purpose === "PROFILE_IMAGE" &&
      !verified.mimeType.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Profile photos must be image files." },
        { status: 400 },
      );
    }

    const existing = await prisma.uploadedMedia.findUnique({
      where: {
        storageKey: verified.key,
      },
    });

    if (existing) {
      if (
        existing.uploaderId !== session.user.id ||
        existing.purpose !== input.purpose ||
        existing.sizeBytes !== BigInt(verified.size) ||
        existing.mimeType !== verified.mimeType
      ) {
        return NextResponse.json(
          { error: "This upload has already been registered." },
          { status: 409 },
        );
      }

      return NextResponse.json({
        id: existing.id,
        key: verified.key,
      });
    }

    const type = verified.mimeType.startsWith("image/")
      ? "IMAGE"
      : verified.mimeType.startsWith("video/")
        ? "VIDEO"
        : null;

    if (!type) {
      return NextResponse.json(
        { error: "Unsupported media file type." },
        { status: 400 },
      );
    }

    if (input.purpose === "PROFILE_IMAGE" && type !== "IMAGE") {
      return NextResponse.json(
        { error: "Profile photos must be images." },
        { status: 400 },
      );
    }

    const media = await prisma.uploadedMedia.create({
      data: {
        uploaderId: session.user.id,
        storageKey: verified.key,
        url: `r2://${process.env.R2_BUCKET_NAME}/${verified.key}`,
        fileName,
        mimeType: verified.mimeType,
        type,
        purpose: input.purpose,
        sizeBytes: BigInt(verified.size),
        status: "UPLOADED",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      id: media.id,
      key: verified.key,
    });
  } catch (error) {
    console.error("R2 upload completion error:", error);

    return NextResponse.json(
      {
        error: "Unable to complete the upload.",
      },
      { status: 400 },
    );
  }
}