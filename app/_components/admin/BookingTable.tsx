"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Clock3,
  Eye,
  GraduationCap,
  Mail,
  X,
  Ban,
  UserX,
  LoaderCircle,
  MoreVertical,
} from "lucide-react";
import { updateBookingLifecycle } from "@/app/actions/admin-bookings";

type Person = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl?: string | null;
};

type BookingRow = {
  id: string;
  paymentAmount?: number | null;
  studentId: string;
  educatorId: string;
  serviceId: string | null;
  availabilityId: string | null;
  startTime: Date | string;
  endTime: Date | string;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  description: string | null;
  payoutStatus: string | null;
  stripeSessionId?: string | null;
  paymentIntentId?: string | null;
  videoSessionId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  student: Person;
  educator: Person;
  service: {
    id?: string;
    title: string | null;
    type: string | null;
    price: number | null;
    currency: string | null;
    durationMinutes: number | null;
    subject: string | null;
  } | null;
  availability: {
    id: string;
    startTime: Date | string | null;
    endTime: Date | string | null;
    status: string;
  } | null;
  tutoringSession?: {
    id: string;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    status: string;
    learnerAttendance: boolean | null;
    educatorAttendance: boolean | null;
    topic: string | null;
  } | null;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date | string | null | undefined) {
  const date = asDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  const date = asDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value: Date | string | null | undefined) {
  const date = asDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(
  value: number | null | undefined,
  currency?: string | null,
) {
  if (value == null) return "—";
  try {
    // Service prices in the bookings page are stored in the smallest currency unit.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value / 100);
  } catch {
    return `${currency || "USD"} ${(value / 100).toFixed(2)}`;
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "Scheduled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PendingPayment":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "NoShow":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function statusLabel(status: string) {
  if (status === "PendingPayment") return "Pending payment";
  if (status === "NoShow") return "No show";
  return status;
}

// payoutStatus tracks money owed to the tutor; it is not the learner's payment.
// In this booking flow, successful payment moves the booking to Scheduled.
function learnerPaymentStatus(booking: BookingRow) {
  if (booking.status === "PendingPayment") return "Pending payment";
  if (
    booking.status === "Scheduled" ||
    booking.status === "Completed" ||
    Boolean(booking.paymentIntentId || booking.stripeSessionId)
  )
    return "Paid";
  if (booking.status === "Cancelled") return "Cancelled";
  return "Not confirmed";
}

function durationLabel(booking: BookingRow) {
  if (booking.service?.durationMinutes != null) {
    return `${booking.service.durationMinutes} minutes`;
  }
  const start = asDate(booking.startTime)?.getTime();
  const end = asDate(booking.endTime)?.getTime();
  if (start != null && end != null && end > start) {
    return `${Math.round((end - start) / 60000)} minutes (from schedule)`;
  }
  return "Not set";
}

function initials(name?: string | null) {
  return (name || "Unknown")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Avatar({
  person,
  tint,
}: {
  person: Person;
  tint: "student" | "tutor";
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${
        tint === "student"
          ? "bg-primary/10 text-primary"
          : "bg-violet-100 text-violet-700"
      }`}
    >
      {person.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials(person.name)
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-background p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 break-words text-sm font-medium">
        {children || "—"}
      </div>
    </div>
  );
}

export default function BookingTable({ bookings }: { bookings: BookingRow[] }) {
  const [activeBooking, setActiveBooking] = useState<BookingRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const router = useRouter();

  function runBookingAction(booking: BookingRow, action: "cancel" | "no-show") {
    const label =
      action === "cancel"
        ? "cancel this booking"
        : "mark this learner as a no-show";
    if (
      !window.confirm(
        `Are you sure you want to ${label}? The record will be retained for reporting.`,
      )
    )
      return;

    setActionError(null);
    startTransition(async () => {
      const result = await updateBookingLifecycle(booking.id, action);
      if (!result.ok) {
        setActionError(result.error || "The booking could not be updated.");
        return;
      }
      setActiveBooking((current) => {
        if (!current || current.id !== booking.id) return current;
        const updatedStatus = action === "cancel" ? "Cancelled" : "NoShow";
        return {
          ...current,
          status: updatedStatus,
          tutoringSession: current.tutoringSession
            ? {
                ...current.tutoringSession,
                status: action === "cancel" ? "CANCELLED" : "NO_SHOW",
                learnerAttendance:
                  action === "no-show"
                    ? false
                    : current.tutoringSession.learnerAttendance,
              }
            : current.tutoringSession,
        };
      });
      router.refresh();
    });
  }

  function canChangeStatus(booking: BookingRow) {
    return (
      booking.status !== "Cancelled" &&
      booking.status !== "Completed" &&
      booking.status !== "NoShow"
    );
  }

  function renderActionMenu(booking: BookingRow) {
    const menuOpen = openActionMenuId === booking.id;
    const canUpdate = canChangeStatus(booking);

    return (
      <div className="relative inline-flex">
        <button
          type="button"
          aria-label={`Actions for booking ${booking.id}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            if (menuOpen) {
              setOpenActionMenuId(null);
              setActionMenuPosition(null);
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const menuWidth = 208;
            setActionMenuPosition({
              top: Math.min(rect.bottom + 8, window.innerHeight - 164),
              left: Math.max(
                8,
                Math.min(
                  rect.right - menuWidth,
                  window.innerWidth - menuWidth - 8,
                ),
              ),
            });
            setOpenActionMenuId(booking.id);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          title="More actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        {menuOpen &&
          actionMenuPosition &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <button
                type="button"
                aria-label="Close actions menu"
                className="fixed inset-0 z-[9998] cursor-default"
                onClick={() => {
                  setOpenActionMenuId(null);
                  setActionMenuPosition(null);
                }}
              />
              <div
                role="menu"
                aria-label={`Booking ${booking.id} actions`}
                style={{
                  top: actionMenuPosition.top,
                  left: actionMenuPosition.left,
                }}
                className="fixed z-[9999] w-52 overflow-hidden rounded-xl border border-border bg-card p-1.5 text-left shadow-2xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setActionMenuPosition(null);
                    setActionError(null);
                    setActiveBooking(booking);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  View details
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canUpdate || isPending}
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setActionMenuPosition(null);
                    runBookingAction(booking, "cancel");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Ban className="h-4 w-4" />
                  Cancel booking
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canUpdate || isPending}
                  onClick={() => {
                    setOpenActionMenuId(null);
                    setActionMenuPosition(null);
                    runBookingAction(booking, "no-show");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <UserX className="h-4 w-4" />
                  Mark no-show
                </button>
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  }

  useEffect(() => {
    if (!activeBooking) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveBooking(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeBooking]);

  useEffect(() => {
    if (!openActionMenuId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenActionMenuId(null);
        setActionMenuPosition(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openActionMenuId]);

  return (
    <>
      <div className="hidden w-full lg:block">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/70 bg-muted/30 text-left">
              {[
                "Booking date",
                "Student",
                "Tutor",
                "Schedule time",
                "Status",
                "Amount",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-2.5 py-3 text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground xl:px-3 xl:text-[11px]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-semibold">
                    No bookings found
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try changing your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <p className="truncate text-xs font-semibold xl:text-sm">
                      {formatDate(booking.startTime)}
                    </p>
                    <p
                      className="mt-1 truncate font-mono text-[10px] text-muted-foreground"
                      title={booking.id}
                    >
                      #{booking.id}
                    </p>
                  </td>
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="hidden shrink-0 sm:block">
                        <Avatar person={booking.student} tint="student" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-xs font-semibold xl:text-sm"
                          title={booking.student?.name || "Unnamed student"}
                        >
                          {booking.student?.name || "Unnamed student"}
                        </p>
                        <p
                          className="mt-1 truncate text-[10px] text-muted-foreground xl:text-xs"
                          title={booking.student?.email || "No email"}
                        >
                          {booking.student?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="hidden shrink-0 sm:block">
                        <Avatar person={booking.educator} tint="tutor" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-xs font-semibold xl:text-sm"
                          title={booking.educator?.name || "Unnamed tutor"}
                        >
                          {booking.educator?.name || "Unnamed tutor"}
                        </p>
                        <p
                          className="mt-1 truncate text-[10px] text-muted-foreground xl:text-xs"
                          title={booking.educator?.email || "No email"}
                        >
                          {booking.educator?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <p className="flex items-center gap-1 text-xs font-medium xl:text-sm">
                      <Clock3 className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {formatTime(booking.startTime)}–
                        {formatTime(booking.endTime)}
                      </span>
                    </p>
                    <p
                      className="mt-1 truncate text-[10px] text-muted-foreground xl:text-xs"
                      title={
                        booking.service?.title || booking.subject || "Tutoring"
                      }
                    >
                      {booking.service?.title || booking.subject || "Tutoring"}
                    </p>
                  </td>
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <span
                      title={statusLabel(booking.status)}
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold xl:text-xs ${statusStyle(booking.status)}`}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      <span className="truncate">
                        {statusLabel(booking.status)}
                      </span>
                    </span>
                  </td>
                  <td className="px-2.5 py-3 align-middle xl:px-3">
                    <p className="truncate text-xs font-bold xl:text-sm">
                      {formatMoney(
                        booking.paymentAmount ?? booking.service?.price,
                        booking.service?.currency,
                      )}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground xl:text-xs">
                      {learnerPaymentStatus(booking)}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    {renderActionMenu(booking)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border/60 lg:hidden">
        {bookings.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-semibold">No bookings found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <article key={booking.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">
                    {formatDate(booking.startTime)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    #{booking.id}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle(booking.status)}`}
                >
                  {statusLabel(booking.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar person={booking.student} tint="student" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Student
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {booking.student?.name || "Unnamed student"}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar person={booking.educator} tint="tutor" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Tutor
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {booking.educator?.name || "Unnamed tutor"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatTime(booking.startTime)} –{" "}
                    {formatTime(booking.endTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="mt-1 text-sm font-bold">
                    {formatMoney(
                      booking.paymentAmount ?? booking.service?.price,
                      booking.service?.currency,
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end border-t border-border/60 pt-3">
                {renderActionMenu(booking)}
              </div>
            </article>
          ))
        )}
      </div>

      {activeBooking && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveBooking(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border/70 bg-card shadow-2xl sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border/70 bg-muted/20 px-5 py-5 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  Booking details
                </p>
                <h2
                  id="booking-modal-title"
                  className="mt-1 break-all text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Booking #{activeBooking.id}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created {formatDateTime(activeBooking.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close booking details"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${statusStyle(activeBooking.status)}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {statusLabel(activeBooking.status)}
                </span>
                <p className="text-xl font-bold">
                  {formatMoney(
                    activeBooking.paymentAmount ?? activeBooking.service?.price,
                    activeBooking.service?.currency,
                  )}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar person={activeBooking.student} tint="student" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Student
                      </p>
                      <p className="mt-1 truncate font-semibold">
                        {activeBooking.student?.name || "Unnamed student"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />{" "}
                        {activeBooking.student?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar person={activeBooking.educator} tint="tutor" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Tutor
                      </p>
                      <p className="mt-1 truncate font-semibold">
                        {activeBooking.educator?.name || "Unnamed tutor"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />{" "}
                        {activeBooking.educator?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold">Schedule & service</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Booking date">
                    {formatDate(activeBooking.startTime)}
                  </Field>
                  <Field label="Session time">
                    {formatTime(activeBooking.startTime)} –{" "}
                    {formatTime(activeBooking.endTime)}
                  </Field>
                  <Field label="Service">
                    {activeBooking.service?.title || "Tutoring"}
                  </Field>
                  <Field label="Service type">
                    {activeBooking.service?.type?.replaceAll("_", " ") ||
                      "Not set"}
                  </Field>
                  <Field label="Subject">
                    {activeBooking.subject ||
                      activeBooking.service?.subject ||
                      "General tutoring"}
                  </Field>
                  <Field label="Grade level">
                    {activeBooking.gradeLevel || "Not provided"}
                  </Field>
                  <Field label="Duration">{durationLabel(activeBooking)}</Field>
                  <Field label="Learner payment">
                    {learnerPaymentStatus(activeBooking)}
                  </Field>
                  <Field label="Tutor payout status">
                    {activeBooking.payoutStatus || "Not set"}
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold">Booking information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Booking ID">{activeBooking.id}</Field>
                  <Field label="Booking status">
                    {statusLabel(activeBooking.status)}
                  </Field>
                  <Field label="Student ID">{activeBooking.studentId}</Field>
                  <Field label="Tutor ID">{activeBooking.educatorId}</Field>
                  <Field label="Service ID">
                    {activeBooking.serviceId ||
                      activeBooking.service?.id ||
                      "No service linked"}
                  </Field>
                  <Field label="Availability ID">
                    {activeBooking.availabilityId ||
                      activeBooking.availability?.id ||
                      "—"}
                  </Field>
                  <Field label="Created">
                    {formatDateTime(activeBooking.createdAt)}
                  </Field>
                  <Field label="Last updated">
                    {formatDateTime(activeBooking.updatedAt)}
                  </Field>
                  <Field label="Video session ID">
                    {activeBooking.videoSessionId || "Not created"}
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold">Session description</h3>
                <div className="rounded-xl border border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
                  {activeBooking.description?.trim() ||
                    "No additional description was provided for this booking."}
                </div>
              </div>

              {activeBooking.tutoringSession && (
                <div className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />{" "}
                    Tutoring session
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Session ID">
                      {activeBooking.tutoringSession.id}
                    </Field>
                    <Field label="Session status">
                      {activeBooking.tutoringSession.status}
                    </Field>
                    <Field label="Scheduled start">
                      {formatDateTime(
                        activeBooking.tutoringSession.scheduledStart,
                      )}
                    </Field>
                    <Field label="Scheduled end">
                      {formatDateTime(
                        activeBooking.tutoringSession.scheduledEnd,
                      )}
                    </Field>
                    <Field label="Topic">
                      {activeBooking.tutoringSession.topic ||
                        activeBooking.subject ||
                        activeBooking.service?.subject ||
                        "Not set"}
                    </Field>
                    <Field label="Student attendance">
                      {activeBooking.tutoringSession.learnerAttendance == null
                        ? "Not recorded"
                        : activeBooking.tutoringSession.learnerAttendance
                          ? "Present"
                          : "Absent"}
                    </Field>
                    <Field label="Tutor attendance">
                      {activeBooking.tutoringSession.educatorAttendance == null
                        ? "Not recorded"
                        : activeBooking.tutoringSession.educatorAttendance
                          ? "Present"
                          : "Absent"}
                    </Field>
                  </div>
                </div>
              )}

              {activeBooking.availability && (
                <div className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />{" "}
                    Linked availability
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Availability status">
                      {activeBooking.availability.status}
                    </Field>
                    <Field label="Availability time">
                      {formatDateTime(activeBooking.availability.startTime)} –{" "}
                      {formatTime(activeBooking.availability.endTime)}
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {actionError && (
              <div
                role="alert"
                className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7"
              >
                {actionError}
              </div>
            )}

            <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-4 sm:px-7">
              <div className="hidden items-center gap-2 sm:flex">
                {canChangeStatus(activeBooking) && (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runBookingAction(activeBooking, "cancel")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runBookingAction(activeBooking, "no-show")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 px-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4" /> Mark no-show
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="ml-auto inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
