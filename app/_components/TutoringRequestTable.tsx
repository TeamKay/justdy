"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Ban,
  ClipboardList,
  Eye,
  Loader2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AssignTutorSelect from "@/app/_components/assign-tutor-select";
import TutoringPlanEditor from "@/app/_components/Tutoring-plan-editor";
import SendTutoringPaymentLink from "@/app/_components/send-tutoring-payment-link";
import TutoringPaymentDetailsModal from "@/app/_components/TutoringPaymentDetailsModal";
import EnrollmentContactSummary from "@/app/_components/EnrollmentContactSummary";

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type AssignmentOption = {
  id: string;
  name: string;
  email: string;
  assignmentLabel: string;
};
type TutoringRequest = {
  id: string;
  studentName: string;
  gradeLevel: string;
  guardianName: string;
  enrollmentType?: "self" | "parent_guardian" | "other_person" | string | null;
  email: string;
  learnerEmail: string | null;
  billingEmail: string | null;
  learnerUserId: string | null;
  learnerAccountSetupSentAt: string | null;
  phoneNumber: string;
  preferredContact: string;
  potentialStartDate: string;
  createdAt: string;
  additionalInfo: string;
  assignedTutorId: string;
  assignedTutorName: string;
  assignedTutorEmail: string;
  assignedTutorContact: string;
  status: string;
  paymentStatus: string;
  subject: string;
  learningGoals: string;
  agreedSchedule: string;
  sessionDurationMinutes: number | null;
  sessionsPerWeek: number | null;
  courseDurationWeeks: number | null;
  agreedRateCents: number | null;
  currency: string;
  paymentPlan: string;
  installmentCount: number;
  planNotes: string;
  planAgreedAt: string | null;
  planAgreedByName: string | null;
  paymentLinkEmailSentAt: string | null;
  billing: {
    totalCents: number | null;
    paidCents: number;
    remainingCents: number | null;
    currency: string;
    payments: {
      id: string;
      installmentNumber: number;
      amountCents: number;
      currency: string;
      status: string;
      paidAt: string | null;
      emailSentAt: string | null;
    }[];
  };
};

export default function TutoringRequestTable({
  requests,
  assignmentOptions,
}: {
  requests: TutoringRequest[];
  assignmentOptions: AssignmentOption[];
}) {
  const [selected, setSelected] = useState<TutoringRequest | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const portalReady = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function cancelRequest(request: TutoringRequest) {
    const confirmed = window.confirm(
      `Cancel the tutoring request for ${request.studentName}? This action cannot be undone.`,
    );
    if (!confirmed) return;
    setCancellingId(request.id);
    setOpenMenu(null);
    try {
      const response = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(request.id)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.error || "Could not cancel this request.");
      toast.success(data.message || "Tutoring request cancelled.");
      if (selected?.id === request.id) setSelected(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel this request.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 rounded-t-lg border-b border-slate-100 bg-linear-to-r from-emerald-50 via-white to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-950">
          <div>
            <p className="mt-1 text-sm text-slate-500">
              Manage learner intake, tutor assignments, plans, and payment
              status.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-286 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                {[
                  "Learner",
                  "Submitted",
                  "Assigned tutor",
                  "Request status",
                  "Payment status",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="group transition-colors odd:bg-white even:bg-slate-50/45 hover:bg-emerald-50/60 dark:odd:bg-slate-950 dark:even:bg-slate-900/25 dark:hover:bg-emerald-950/20"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {initials(request.studentName)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {request.studentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.gradeLevel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="w-92 min-w-92 px-5 py-4">
                    <div className="w-88 min-w-88">
                      <AssignTutorSelect
                        requestId={request.id}
                        initialTutorId={request.assignedTutorId}
                        tutors={assignmentOptions}
                      />
                    </div>
                    <p
                      className={`mt-2 text-xs ${request.assignedTutorName ? "text-slate-500" : "font-medium text-amber-700"}`}
                    >
                      {request.assignedTutorName
                        ? `Assigned to ${request.assignedTutorName}`
                        : ""}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill value={request.status} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill value={request.paymentStatus} />
                    {request.paymentLinkEmailSentAt ? (
                      <p className="mt-1.5 whitespace-nowrap text-[11px] text-slate-500">
                        Link emailed{" "}
                        {formatDate(request.paymentLinkEmailSentAt)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label={`Actions for ${request.studentName}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenu === request.id}
                        onClick={(event) => {
                          if (openMenu === request.id) {
                            setOpenMenu(null);
                            setMenuPosition(null);
                            return;
                          }
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          const menuHeight = 108;
                          const top =
                            rect.bottom + menuHeight > window.innerHeight - 8
                              ? Math.max(8, rect.top - menuHeight - 8)
                              : rect.bottom + 8;
                          setMenuPosition({
                            top,
                            left: Math.max(
                              8,
                              Math.min(
                                rect.right - 208,
                                window.innerWidth - 216,
                              ),
                            ),
                          });
                          setOpenMenu(request.id);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">
              No tutoring requests yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              New onboarding submissions will appear here.
            </p>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          <span>Sorted by newest submission</span>
          <span>{requests.length} total</span>
        </div>
      </div>

      {portalReady && openMenu && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 9999,
              }}
              className="w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xl ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950"
            >
              {(() => {
                const request = requests.find((item) => item.id === openMenu);
                if (!request) return null;
                return (
                  <>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setSelected(request);
                        setOpenMenu(null);
                        setMenuPosition(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <Eye className="h-4 w-4 text-slate-500" />
                      Open tutoring plan
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      role="menuitem"
                      type="button"
                      disabled={
                        cancellingId === request.id ||
                        request.status.toLowerCase() === "cancelled" ||
                        request.paymentStatus.toLowerCase() === "paid" ||
                        request.paymentStatus.toLowerCase() ===
                          "payment_received"
                      }
                      onClick={() => void cancelRequest(request)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      {cancellingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      {request.status.toLowerCase() === "cancelled"
                        ? "Request cancelled"
                        : "Cancel request"}
                    </button>
                  </>
                );
              })()}
            </div>,
            document.body,
          )
        : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutoring-plan-dialog-title"
            className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-lg border border-slate-200 bg-white shadow-lg sm:rounded-lg dark:border-slate-800 dark:bg-slate-950"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div>
                <h2
                  id="tutoring-plan-dialog-title"
                  className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
                >
                  Tutoring Planning
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">
                    Request id:
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {selected.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close tutoring plan"
                onClick={() => setSelected(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-3 p-5 sm:p-6">
              <EnrollmentContactSummary
                enrollmentType={selected.enrollmentType}
                studentName={selected.studentName}
                contactName={selected.guardianName}
                email={selected.email}
                createdAt={selected.createdAt}
                potentialStartDate={selected.potentialStartDate}
                assignedTutorName={selected.assignedTutorName}
                assignedTutorEmail={selected.assignedTutorEmail}
                assignedTutorContact={selected.assignedTutorContact}
                phoneNumber={selected.phoneNumber}
                preferredContact={selected.preferredContact}
                gradeLevel={selected.gradeLevel}
                learnerEmail={selected.learnerEmail}
                learnerUserId={selected.learnerUserId}
                learnerAccountSetupSentAt={selected.learnerAccountSetupSentAt}
                planAgreedAt={selected.planAgreedAt}
              />

              <section>
                <TutoringPlanEditor
                  requestId={selected.id}
                  guardianEmail={selected.email}
                  initialLearnerEmail={selected.learnerEmail ?? ""}
                  initialBillingEmail={selected.billingEmail ?? selected.email}
                  learnerUserId={selected.learnerUserId}
                  setupSentAt={selected.learnerAccountSetupSentAt}
                  initial={{
                    subject: selected.subject,
                    learningGoals: selected.learningGoals,
                    agreedSchedule: selected.agreedSchedule,
                    sessionDurationMinutes: selected.sessionDurationMinutes,
                    sessionsPerWeek: selected.sessionsPerWeek,
                    courseDurationWeeks: selected.courseDurationWeeks,
                    agreedRateCents: selected.agreedRateCents,
                    currency: selected.currency,
                    paymentPlan: selected.paymentPlan,
                    installmentCount: selected.installmentCount,
                    planNotes: selected.planNotes,
                    status: selected.status,
                    paymentStatus: selected.paymentStatus,
                    planAgreedAt: selected.planAgreedAt,
                    planAgreedByName: selected.planAgreedByName,
                  }}
                />
              </section>
            </div>
            <footer className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}
function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const classes =
    normalized === "paid" ||
    normalized === "payment_received" ||
    normalized === "plan_agreed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
      : normalized === "payment_requested"
        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
        : normalized.includes("cancel") || normalized.includes("failed")
          ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300";
  return (
    <span
      className={`inline-flex max-w-44 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800 dark:text-slate-200">
        {value || "Not provided"}
      </dd>
    </div>
  );
}
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}
function BillingSummary({
  billing,
  expanded = false,
}: {
  billing: TutoringRequest["billing"];
  expanded?: boolean;
}) {
  return (
    <div className={expanded ? "grid gap-3 sm:grid-cols-3" : "space-y-1.5"}>
      <div>
        <p className="text-xs text-slate-500">Total bill</p>
        <p className="font-semibold">
          {billing.totalCents === null
            ? "Plan incomplete"
            : money(billing.totalCents, billing.currency)}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500">Paid</p>
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
          {money(billing.paidCents, billing.currency)}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500">Remaining</p>
        <p className="font-semibold text-amber-700 dark:text-amber-400">
          {billing.remainingCents === null
            ? "—"
            : money(billing.remainingCents, billing.currency)}
        </p>
      </div>
    </div>
  );
}
