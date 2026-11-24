import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-auth";

function isValidLinkUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const access = await requireAdminApi();

  if (!access.authorized) {
    return access.response;
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      announcements,
      count: announcements.length,
    });
  } catch (error) {
    console.error("Admin announcements GET error:", error);

    return NextResponse.json(
      { error: "Unable to load announcements." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();

  if (!access.authorized) {
    return access.response;
  }

  try {
    const body = await request.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const linkLabel =
      typeof body.linkLabel === "string"
        ? body.linkLabel.trim()
        : "";

    const linkUrl =
      typeof body.linkUrl === "string" ? body.linkUrl.trim() : "";

    const isPublished = body.isPublished === true;

    if (!message || message.length > 300) {
      return NextResponse.json(
        { error: "Message is required and must be 300 characters or fewer." },
        { status: 400 },
      );
    }

    if (linkLabel.length > 60 || linkUrl.length > 500) {
      return NextResponse.json(
        { error: "The call-to-action label or URL is too long." },
        { status: 400 },
      );
    }

    if (Boolean(linkLabel) !== Boolean(linkUrl)) {
      return NextResponse.json(
        { error: "Provide both a link label and a link URL, or leave both empty." },
        { status: 400 },
      );
    }

    if (linkUrl && !isValidLinkUrl(linkUrl)) {
      return NextResponse.json(
        { error: "Use a relative site path or a secure HTTPS URL." },
        { status: 400 },
      );
    }

    const announcement = await prisma.$transaction(async (tx) => {
      if (isPublished) {
        await tx.announcement.updateMany({
          where: { isPublished: true },
          data: { isPublished: false },
        });
      }

      return tx.announcement.create({
        data: {
          message,
          linkLabel: linkLabel || null,
          linkUrl: linkUrl || null,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        },
      });
    });

    return NextResponse.json(
      { announcement },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin announcements POST error:", error);

    return NextResponse.json(
      { error: "Unable to create announcement." },
      { status: 500 },
    );
  }
}