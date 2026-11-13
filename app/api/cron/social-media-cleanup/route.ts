import { NextResponse } from "next/server";
import { r2Storage } from "@/lib/storage/r2";
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
      { status: 401 },
    );
  }

  const cutoff = new Date(
    Date.now() - RETENTION_HOURS * 60 * 60 * 1000,
  );

  try {
    const pendingBefore = await prisma.uploadedMedia.count({
      where: {
        purpose: "SOCIAL_POST",
        status: "DELETING",
      },
    });

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
          storageKey: true,
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

    let processed = 0;
    let deletionConfirmed = true;

    if (reservedMedia.length > 0) {
      const deletionResults = await Promise.allSettled(
        reservedMedia.map((media) =>
          r2Storage.delete(media.storageKey),
        ),
      );

      const failedDeletions = deletionResults
        .map((result, index) => ({
          result,
          mediaId: reservedMedia[index].id,
        }))
        .filter((item) => item.result.status === "rejected");

      deletionConfirmed = failedDeletions.length === 0;

      if (deletionConfirmed) {
        const removed = await prisma.uploadedMedia.deleteMany({
          where: {
            id: { in: reservedMedia.map((media) => media.id) },
            purpose: "SOCIAL_POST",
            status: "DELETING",
            posts: { none: {} },
          },
        });

        processed = removed.count;

        if (removed.count !== reservedMedia.length) {
          console.error(
            "Some media records remain after confirmed R2 deletion.",
            {
              expected: reservedMedia.length,
              removed: removed.count,
            },
          );
        }
      } else {
        console.error("R2 social media deletion incomplete.", {
          expected: reservedMedia.length,
          failed: failedDeletions.map((item) => ({
            mediaId: item.mediaId,
            error:
              item.result.status === "rejected"
                ? String(item.result.reason)
                : undefined,
          })),
        });
      }
    }

    const pendingAfter = await prisma.uploadedMedia.count({
      where: {
        purpose: "SOCIAL_POST",
        status: "DELETING",
      },
    });

    const oldestPending = await prisma.uploadedMedia.findFirst({
      where: {
        purpose: "SOCIAL_POST",
        status: "DELETING",
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const ok =
      deletionConfirmed &&
      processed === reservedMedia.length;

    if (pendingAfter > 0) {
      console.warn("Social media cleanup has unresolved records.", {
        pendingBefore,
        pendingAfter,
        oldestPendingCreatedAt: oldestPending?.createdAt ?? null,
      });
    }

    return NextResponse.json(
      {
        ok,
        processed,
        expected: reservedMedia.length,
        pendingBefore,
        pendingAfter,
        oldestPendingCreatedAt: oldestPending?.createdAt ?? null,
        checkedAt: new Date().toISOString(),
      },
      { status: ok ? 200 : 207 },
    );
  } catch (error) {
    console.error("Social media cleanup cron failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Social media cleanup failed.",
      },
      { status: 500 },
    );
  }
}