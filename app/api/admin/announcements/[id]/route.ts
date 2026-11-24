import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminApi();

  if (!access.authorized) {
    return access.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 },
      );
    }

    const data: {
      message?: string;
      linkLabel?: string | null;
      linkUrl?: string | null;
      isPublished?: boolean;
      publishedAt?: Date | null;
    } = {};

    if (body.message !== undefined) {
      if (
        typeof body.message !== "string" ||
        !body.message.trim() ||
        body.message.trim().length > 300
      ) {
        return NextResponse.json(
          { error: "Message is required and must be 300 characters or fewer." },
          { status: 400 },
        );
      }

      data.message = body.message.trim();
    }

    if (body.linkLabel !== undefined) {
      if (
        body.linkLabel !== null &&
        (typeof body.linkLabel !== "string" ||
          body.linkLabel.trim().length > 60)
      ) {
        return NextResponse.json(
          { error: "The link label must be 60 characters or fewer." },
          { status: 400 },
        );
      }

      data.linkLabel =
        typeof body.linkLabel === "string" && body.linkLabel.trim()
          ? body.linkLabel.trim()
          : null;
    }

    if (body.linkUrl !== undefined) {
      if (
        body.linkUrl !== null &&
        (typeof body.linkUrl !== "string" ||
          body.linkUrl.trim().length > 500)
      ) {
        return NextResponse.json(
          { error: "The link URL must be 500 characters or fewer." },
          { status: 400 },
        );
      }

      data.linkUrl =
        typeof body.linkUrl === "string" && body.linkUrl.trim()
          ? body.linkUrl.trim()
          : null;
    }

   const nextLabel =
  "linkLabel" in data ? data.linkLabel : existing.linkLabel;

const nextUrl =
  "linkUrl" in data ? data.linkUrl : existing.linkUrl;

    if (Boolean(nextLabel) !== Boolean(nextUrl)) {
      return NextResponse.json(
        { error: "Provide both a link label and a link URL, or leave both empty." },
        { status: 400 },
      );
    }

    if (nextUrl && !isValidLinkUrl(nextUrl)) {
      return NextResponse.json(
        { error: "Use a relative site path or a secure HTTPS URL." },
        { status: 400 },
      );
    }

    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") {
        return NextResponse.json(
          { error: "isPublished must be a boolean." },
          { status: 400 },
        );
      }

      data.isPublished = body.isPublished;

      if (body.isPublished && !existing.isPublished) {
        data.publishedAt = new Date();
      }
    }

    const announcement = await prisma.$transaction(async (tx) => {
      if (data.isPublished === true) {
        await tx.announcement.updateMany({
          where: {
            isPublished: true,
            id: { not: id },
          },
          data: { isPublished: false },
        });
      }

      return tx.announcement.update({
        where: { id },
        data,
      });
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Admin announcements PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update announcement." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminApi();

  if (!access.authorized) {
    return access.response;
  }

  try {
    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 },
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin announcements DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to delete announcement." },
      { status: 500 },
    );
  }
}