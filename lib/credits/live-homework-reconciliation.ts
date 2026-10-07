import "server-only";

import prisma from "@/lib/prisma";
import {
  CreditReservationStatus,
  CreditTransactionType,
} from "@/lib/generated/prisma/client";

const LIVE_HOMEWORK_REFERENCE_TYPE = "LIVE_HOMEWORK_SESSION";

export const DEFAULT_LIVE_HOMEWORK_CONNECTING_TIMEOUT_MINUTES = 10;
export const MAX_LIVE_HOMEWORK_RECONCILE_LIMIT = 100;

export type ReconcileLiveHomeworkOptions = {
  now?: Date;
  limit?: number;
};

export type ReconcileLiveHomeworkResult = {
  scanned: number;
  released: number;
  skipped: number;
  orphaned: number;
};

export function getLiveHomeworkConnectingTimeoutMinutes() {
  const raw = Number(process.env.LIVE_HOMEWORK_CONNECTING_TIMEOUT_MINUTES ?? "");
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_LIVE_HOMEWORK_CONNECTING_TIMEOUT_MINUTES;
  }
  return Math.min(60, Math.floor(raw));
}

/**
 * Releases reservations that expired while their classroom never started.
 *
 * Important concurrency rule: the reservation is claimed and the classroom
 * is transitioned from CONNECTING -> ENDED inside the same short DB
 * transaction. A concurrent START therefore either wins first (and this
 * reconciliation skips it) or loses the race (and cannot start it afterward).
 */
export async function reconcileStaleLiveHomeworkReservations(
  options: ReconcileLiveHomeworkOptions = {},
): Promise<ReconcileLiveHomeworkResult> {
  const now = options.now ?? new Date();
  const requestedLimit = options.limit ?? 50;
  const limit = Math.max(
    1,
    Math.min(MAX_LIVE_HOMEWORK_RECONCILE_LIMIT, Math.floor(requestedLimit)),
  );

  const expired = await prisma.creditReservation.findMany({
    where: {
      referenceType: LIVE_HOMEWORK_REFERENCE_TYPE,
      status: CreditReservationStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
      referenceId: true,
    },
  });

  let released = 0;
  let skipped = 0;
  let orphaned = 0;

  for (const candidate of expired) {
    const outcome = await prisma.$transaction(async (tx) => {
      const reservation = await tx.creditReservation.findUnique({
        where: { id: candidate.id },
      });

      if (!reservation || reservation.status !== CreditReservationStatus.ACTIVE) {
        return "skipped" as const;
      }

      const session = await tx.liveHomeworkSession.findUnique({
        where: { id: reservation.referenceId },
        select: {
          id: true,
          requestId: true,
          status: true,
          startedAt: true,
          endedAt: true,
          teacherRate: true,
          currency: true,
        },
      });

      // A reservation without its session is an orphan. There is no active
      // classroom that could legitimately consume these credits, so release
      // it rather than leaving the learner's wallet locked forever.
      if (!session) {
        const claimed = await tx.creditReservation.updateMany({
          where: {
            id: reservation.id,
            status: CreditReservationStatus.ACTIVE,
          },
          data: {
            status: CreditReservationStatus.RELEASED,
            releasedAt: now,
          },
        });

        if (claimed.count !== 1) return "skipped" as const;

        await tx.userCredit.update({
          where: { id: reservation.userCreditId },
          data: {
            balance: { increment: reservation.amount },
            reservedBalance: { decrement: reservation.amount },
          },
        });

        await tx.creditTransaction.create({
          data: {
            userId: reservation.userId,
            userCreditId: reservation.userCreditId,
            amount: 0,
            type: CreditTransactionType.RELEASE,
            description: `Released ${reservation.amount} credits from orphaned Live Homework reservation`,
            referenceType: reservation.referenceType,
            referenceId: reservation.referenceId,
            idempotencyKey: `reservation:${reservation.id}:release`,
          },
        });

        return "orphaned" as const;
      }

      // Never release a reservation for a session that has started. Normal
      // END settlement owns ACTIVE sessions, even if an old expiresAt exists.
      if (session.status !== "CONNECTING" || session.startedAt !== null) {
        return "skipped" as const;
      }

      // Claim the reservation first. If END settles it concurrently, this
      // conditional update returns zero and the whole transaction does no work.
      const claimed = await tx.creditReservation.updateMany({
        where: {
          id: reservation.id,
          status: CreditReservationStatus.ACTIVE,
        },
        data: {
          status: CreditReservationStatus.RELEASED,
          releasedAt: now,
        },
      });

      if (claimed.count !== 1) return "skipped" as const;

      // Claim the classroom state in the same transaction. START can therefore
      // never win after reconciliation has marked the session stale.
      const ended = await tx.liveHomeworkSession.updateMany({
        where: {
          id: session.id,
          status: "CONNECTING",
          startedAt: null,
        },
        data: {
          status: "ENDED",
          endedAt: now,
          durationSeconds: 0,
          billableSeconds: 0,
          subtotal: 0,
          platformFee: 0,
          teacherEarnings: 0,
          totalAmount: 0,
          paymentStatus: "Paid",
        },
      });

      if (ended.count !== 1) {
        // Throw so the reservation claim is rolled back. The competing START
        // or END operation remains authoritative.
        throw new Error("LIVE_HOMEWORK_RECONCILE_SESSION_CHANGED");
      }

      await tx.userCredit.update({
        where: { id: reservation.userCreditId },
        data: {
          balance: { increment: reservation.amount },
          reservedBalance: { decrement: reservation.amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: reservation.userId,
          userCreditId: reservation.userCreditId,
          amount: 0,
          type: CreditTransactionType.RELEASE,
          description: `Released ${reservation.amount} credits after Live Homework connection timeout`,
          referenceType: reservation.referenceType,
          referenceId: reservation.referenceId,
          idempotencyKey: `reservation:${reservation.id}:release`,
        },
      });

      await tx.liveHomeworkRequest.updateMany({
        where: {
          id: session.requestId,
          sessionId: session.id,
          status: { in: ["SELECTED", "CONNECTING"] },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
        },
      });

      return "released" as const;
    }).catch((error) => {
      if (error instanceof Error && error.message === "LIVE_HOMEWORK_RECONCILE_SESSION_CHANGED") {
        return "skipped" as const;
      }
      throw error;
    });

    if (outcome === "released") released += 1;
    else if (outcome === "orphaned") orphaned += 1;
    else skipped += 1;
  }

  return {
    scanned: expired.length,
    released,
    skipped,
    orphaned,
  };
}
