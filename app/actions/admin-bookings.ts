"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type BookingLifecycleAction = "cancel" | "no-show";

export async function updateBookingLifecycle(
  bookingId: string,
  action: BookingLifecycleAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!bookingId?.trim()) {
    return { ok: false, error: "A booking ID is required." };
  }

  if (action !== "cancel" && action !== "no-show") {
    return { ok: false, error: "Unsupported booking action." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, error: "Please sign in again." };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, emailVerified: true },
  });

  if (
    !currentUser ||
    String(currentUser.role ?? "")
      .trim()
      .toUpperCase() !== "ADMIN"
  ) {
    return { ok: false, error: "Administrator access is required." };
  }

  if (!currentUser.emailVerified) {
    return { ok: false, error: "Verify your email before changing bookings." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          tutoringSession: { select: { id: true, status: true } },
        },
      });

      if (!booking) {
        throw new Error("Booking not found.");
      }

      if (booking.status === "Completed") {
        throw new Error("Completed bookings cannot be changed.");
      }

      if (booking.status === "Cancelled" || booking.status === "NoShow") {
        throw new Error(
          "This booking is already cancelled or marked as a no-show.",
        );
      }

      if (action === "cancel") {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "Cancelled" },
        });

        if (
          booking.tutoringSession &&
          booking.tutoringSession.status !== "COMPLETED"
        ) {
          await tx.tutoringSession.update({
            where: { id: booking.tutoringSession.id },
            data: { status: "CANCELLED" },
          });
        }
      } else {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "NoShow" },
        });

        if (
          booking.tutoringSession &&
          booking.tutoringSession.status !== "COMPLETED"
        ) {
          await tx.tutoringSession.update({
            where: { id: booking.tutoringSession.id },
            data: {
              status: "NO_SHOW",
              learnerAttendance: false,
            },
          });
        }
      }
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not update booking.",
    };
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/bookings/${bookingId}`);

  return { ok: true };
}
