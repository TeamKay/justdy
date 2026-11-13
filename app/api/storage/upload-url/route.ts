
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createR2UploadUrl } from "@/lib/storage/r2";

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
        { error: "Please sign in before uploading files." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid upload request." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    if (!isUploadPurpose(input.purpose)) {
      return NextResponse.json(
        { error: "Unsupported upload purpose." },
        { status: 400 },
      );
    }

    if (
      typeof input.fileName !== "string" ||
      typeof input.mimeType !== "string" ||
      typeof input.sizeBytes !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid file information." },
        { status: 400 },
      );
    }

    const fileName = input.fileName.trim();
    const mimeType = input.mimeType.trim().toLowerCase();

    if (
      !fileName ||
      fileName.length > 255 ||
      !mimeType ||
      !Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid file name, MIME type, or file size." },
        { status: 400 },
      );
    }

    const upload = await createR2UploadUrl({
      userId: session.user.id,
      purpose: input.purpose,
      fileName,
      mimeType,
      sizeBytes: input.sizeBytes,
    });

    return NextResponse.json(upload);
  } catch (error) {
    console.error("R2 upload URL error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare the file upload.",
      },
      { status: 400 },
    );
  }
}
