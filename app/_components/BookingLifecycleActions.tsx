"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, LoaderCircle, UserX } from "lucide-react";
import { updateBookingLifecycle } from "@/app/actions/admin-bookings";

type Props = {
  bookingId: string;
  status: string;
};

export default function BookingLifecycleActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const terminal = ["Cancelled", "Completed", "NoShow"].includes(status);

  function runAction(action: "cancel" | "no-show") {
    const message =
      action === "cancel"
        ? "Cancel this booking? The booking and linked session records will be retained."
        : "Mark this booking as a no-show? The booking and linked session records will be retained.";

    if (!window.confirm(message)) return;

    setError("");
    startTransition(async () => {
      const result = await updateBookingLifecycle(bookingId, action);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (terminal) {
    return (
      <span className="text-xs text-muted-foreground">
        {status === "NoShow" ? "No-show recorded" : status}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => runAction("no-show")}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
      >
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <UserX className="h-4 w-4" />
        )}
        No-show
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => runAction("cancel")}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50"
      >
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Ban className="h-4 w-4" />
        )}
        Cancel
      </button>
      {error ? (
        <p role="alert" className="w-full text-right text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
