import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 100;
const RETENTION_HOURS = 24;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const cutoff = new Date(
    Date.now() - RETENTION_HOURS * 60 * 60 * 1000
  );

  try {
    const reservedMedia = await prisma.$transaction(async (tx) => {
      const eligible = await tx.uploadedMedia.findMany({
        where: {
          purpose: "SOCIAL_POST",
          status: "UPLOADED",
          createdAt: { lt: cutoff },
          posts: { none: {} },
        },
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        select: {
          id: true,
          uploadThingKey: true,
        },
      });

      if (eligible.length === 0) return [];

      const ids = eligible.map((media) => media.id);

      const reserved = await tx.uploadedMedia.updateMany({
        where: {
          id: { in: ids },
          purpose: "SOCIAL_POST",
          status: "UPLOADED",
          createdAt: { lt: cutoff },
          posts: { none: {} },
        },
        data: { status: "DELETING" },
      });

      if (reserved.count !== eligible.length) {
        throw new Error("Could not reserve all eligible media records.");
      }

      return eligible;
    });

    if (reservedMedia.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: "No stale uploads found.",
      });
    }

    const utapi = new UTApi();

    const deletion = await utapi.deleteFiles(
      reservedMedia.map((media) => media.uploadThingKey)
    );

    if (
      !deletion.success ||
      deletion.deletedCount !== reservedMedia.length
    ) {
      console.error("Social media storage deletion incomplete", {
        expected: reservedMedia.length,
        deleted: deletion.deletedCount,
      });

      // Keep uncertain records in DELETING for reconciliation.
      return NextResponse.json(
        {
          ok: false,
          processed: 0,
          reserved: reservedMedia.length,
          error: "Storage deletion could not be fully confirmed.",
        },
        { status: 207 }
      );
    }

    const removed = await prisma.uploadedMedia.deleteMany({
      where: {
        id: { in: reservedMedia.map((media) => media.id) },
        purpose: "SOCIAL_POST",
        status: "DELETING",
        posts: { none: {} },
      },
    });

    return NextResponse.json({
      ok: removed.count === reservedMedia.length,
      processed: removed.count,
      expected: reservedMedia.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Social media cleanup cron failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Social media cleanup failed.",
      },
      { status: 500 }
    );
  }
}