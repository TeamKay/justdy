"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

type PlanValues = {
  subject: string;
  learningGoals: string;
  agreedSchedule: string;
  sessionDurationMinutes: number | null;
  sessionsPerWeek: number | null;
  courseDurationWeeks?: number | null;
  paymentPlan?: string;
  installmentCount?: number | null;
  agreedRateCents: number | null;
  currency: string;
  planNotes: string;
  status: string;
  paymentStatus: string;
  planAgreedAt: string | null;
  planAgreedByName: string | null;
};

type TutoringPlanEditorProps = {
  requestId: string;
  initial: PlanValues;
  guardianEmail: string;
  initialLearnerEmail: string;
  initialBillingEmail: string;
  learnerUserId: string | null;
  setupSentAt: string | null;
};

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-50";
const labelClass = "block text-sm font-medium text-slate-700";
const cardClass = "rounded-lg border border-slate-200 bg-white shadow-sm";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

export default function TutoringPlanEditor({
  requestId,
  initial,
  guardianEmail,
  initialLearnerEmail,
  initialBillingEmail,
  learnerUserId,
  setupSentAt,
}: TutoringPlanEditorProps) {
  const [subject, setSubject] = useState(initial.subject);
  const [agreedSchedule, setAgreedSchedule] = useState(
    initial.agreedSchedule ?? "",
  );
  const [learningGoals, setLearningGoals] = useState(initial.learningGoals);
  const [duration, setDuration] = useState(
    initial.sessionDurationMinutes?.toString() ?? "",
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(
    initial.sessionsPerWeek?.toString() ?? "",
  );
  const [courseWeeks, setCourseWeeks] = useState(
    initial.courseDurationWeeks?.toString() ?? "",
  );
  const [paymentPlan, setPaymentPlan] = useState(initial.paymentPlan || "full");
  const [installmentCount, setInstallmentCount] = useState(
    initial.installmentCount?.toString() ?? "",
  );
  const [rate, setRate] = useState(
    initial.agreedRateCents == null
      ? ""
      : (initial.agreedRateCents / 100).toFixed(2),
  );
  const [currency, setCurrency] = useState(initial.currency || "usd");
  const [planNotes, setPlanNotes] = useState(initial.planNotes);
  const [learnerEmail, setLearnerEmail] = useState(initialLearnerEmail);
  const billingEmail = initialBillingEmail || guardianEmail;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmAgreement, setConfirmAgreement] = useState(false);

  const estimatedTotal = useMemo(() => {
    const sessionRate = Math.max(0, Number(rate) || 0);
    const weeklySessions = Math.max(0, Number(sessionsPerWeek) || 0);
    const weeks = Math.max(0, Number(courseWeeks) || 0);
    return sessionRate * weeklySessions * weeks;
  }, [rate, sessionsPerWeek, courseWeeks]);

  useEffect(() => {
    if (!confirmAgreement || busy) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmAgreement(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmAgreement, busy]);

  async function save(action: "save_draft" | "mark_agreed") {
    setMessage("");
    setError("");

    if (action === "mark_agreed") {
      const normalizedLearnerEmail = learnerEmail.trim().toLowerCase();
      if (
        !normalizedLearnerEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedLearnerEmail)
      ) {
        setError(
          "Enter the learner’s own valid email address before marking the plan as agreed. The guardian/contact email cannot be used as the learner login.",
        );
        return;
      }
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      // Keep the learner login email separate from the payment recipient email.
      const emailResponse = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(requestId)}/emails`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            learnerEmail: learnerEmail.trim().toLowerCase(),
            billingEmail: billingEmail.trim().toLowerCase(),
          }),
        },
      );
      const emailData = await emailResponse.json().catch(() => ({}));
      if (!emailResponse.ok) {
        throw new Error(
          emailData.error || "Could not save the learner and payment email addresses.",
        );
      }

      const response = await fetch(
        `/api/tutoring/onboarding/${encodeURIComponent(requestId)}/plan`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            action,
            subject,
            learningGoals,
            // Preserve the saved schedule while its editable field is hidden from this form.
            agreedSchedule: agreedSchedule.trim(),
            sessionDurationMinutes: duration === "" ? null : Number(duration),
            sessionsPerWeek:
              sessionsPerWeek === "" ? null : Number(sessionsPerWeek),
            courseDurationWeeks:
              courseWeeks.trim() === "" ? null : Number(courseWeeks),
            paymentPlan,
            installmentCount:
              paymentPlan === "installments"
                ? installmentCount.trim() === ""
                  ? null
                  : Number(installmentCount)
                : 1,
            agreedRateCents:
              rate.trim() === "" ? null : Math.round(Number(rate) * 100),
            currency,
            planNotes,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save the tutoring plan.");
      }

      if (action === "save_draft") {
        setMessage("Plan draft saved.");
        setConfirmAgreement(false);
        window.location.reload();
        return;
      }

      const accountResponse = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(requestId)}/learner-account`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        },
      );
      const accountData = await accountResponse.json().catch(() => ({}));

      if (!accountResponse.ok) {
        setMessage(
          `Plan agreed, but learner account setup is still pending: ${accountData.error || "Please retry account setup."}`,
        );
        setConfirmAgreement(false);
        return;
      }

      setMessage(
        accountData.message || "Plan agreed and learner account setup requested.",
      );
      setConfirmAgreement(false);
      window.location.reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not complete the requested action.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-5 text-slate-900">
     <section className={`${cardClass} overflow-hidden`}>
  {/* Main Header */}
      <div className="border-b border-slate-200 bg-linear-to-r from-emerald-50 via-white to-white px-5 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-sm">
              Tutoring Plan
            </h2>
          </div>
        </div>
      </div>

  <div className="space-y-8 p-5 sm:p-4">
    {/* SECTION 1: LEARNER ACCOUNT */}
    <div>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div>
          <label className={labelClass}>
            Learner&apos;s own email address{" "}
            <span className="text-rose-600">*</span>

            <input
              type="email"
              required
              value={learnerEmail}
              onChange={(event) => setLearnerEmail(event.target.value)}
              placeholder="learner@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </label>
        </div>
         <label className={labelClass}>
          Agreed schedule <span className="text-rose-600">*</span>

          <input
            className={inputClass}
            type="text"
            value={agreedSchedule}
            onChange={(event) => setAgreedSchedule(event.target.value)}
            maxLength={1000}
            placeholder="e.g. Monday and Wednesday, 4–5 PM"
          />
        </label>
       
      </div>
       <div className="lg:pt-1">
          {learnerUserId ? (
           <div className="flex flex-wrap items-start gap-2 pt-2">
              <p className="text-sm font-semibold text-emerald-900">
                Learner account linked : 
              </p>

              <p className="text-xs leading-5 text-emerald-800">
                {setupSentAt
                  ? `Setup email requested ${new Date(
                      setupSentAt
                    ).toLocaleDateString()}.`
                  : "The learner account is linked successfully."}
              </p>
            </div>
          ) : (
           <div className="flex flex-wrap items-start gap-2 p-4">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Account setup pending : 
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Learner account setup will be requested after the plan
                  is marked as agreed.
                </p>
              </div>
            </div>
          )}
        </div> 
    </div>

    {/* SECTION DIVIDER */}
    <div className="border-t border-slate-100" />

    {/* SECTION 2: LEARNING PLAN DETAILS */}
    <div>
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          Subject

          <input
            className={inputClass}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Mathematics"
          />
        </label>

            <label className={labelClass}>
          Course duration

          <span className="relative mt-1.5 block">
            <input
              className={`${inputClass} mt-0 pr-16`}
              type="number"
              min="1"
              max="104"
              step="1"
              value={courseWeeks}
              onChange={(event) => setCourseWeeks(event.target.value)}
              placeholder="e.g. 12"
            />

            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
              weeks
            </span>
          </span>
        </label>

         <label className={labelClass}>
          Sessions per week

          <input
            className={inputClass}
            type="number"
            min="1"
            max="14"
            step="1"
            value={sessionsPerWeek}
            onChange={(event) => setSessionsPerWeek(event.target.value)}
            placeholder="e.g. 2"
          />
        </label>


        <label className={labelClass}>
          Session duration

          <span className="relative mt-1.5 block">
            <input
              className={`${inputClass} mt-0 pr-20`}
              type="number"
              min="15"
              max="240"
              step="15"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="60"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
              minutes
            </span>
          </span>
        </label>
      </div>

      {/* LEARNING GOALS */}
      <div className="mt-6 rounded-lg p-4 sm:p-0">
        <div className="mb-3 flex items-center gap-2.5">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Your Learning Goals
            </h4>
          </div>
        </div>

        <textarea
          className={`${inputClass} mt-0 min-h-28 resize-y bg-white`}
          rows={3}
          value={learningGoals}
          onChange={(event) => setLearningGoals(event.target.value)}
          placeholder="Describe the learner's goals, focus areas, expected outcomes, and topics to cover."
        />
      </div>
    </div>

    {/* SECTION DIVIDER */}
    <div className="border-t border-slate-100" />

    {/* SECTION 3: ADDITIONAL PLANNING NOTES */}
    <div>
      <label className={labelClass}>
        Planning notes{" "}
        <span className="font-normal text-slate-400">
          (optional)
        </span>

        <textarea
          className={`${inputClass} mt-1.5 min-h-28 resize-y`}
          rows={3}
          value={planNotes}
          onChange={(event) => setPlanNotes(event.target.value)}
          placeholder="Add any additional agreed details, special arrangements, or instructions for the tutoring team."
        />
      </label>

      {initial.planAgreedAt ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-3">
          <CalendarClock
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-slate-500">
            Last marked agreed on{" "}
            {new Date(initial.planAgreedAt).toLocaleString()}
            {initial.planAgreedByName
              ? ` by ${initial.planAgreedByName}`
              : ""}
            .
          </p>
        </div>
      ) : null}
    </div>

  </div>
</section>

      <section className={`${cardClass} p-5 sm:p-6`}>
        <div className="mb-5 flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">Payment arrangement</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className={labelClass}>
            Payment method
            <select
              className={inputClass}
              value={paymentPlan}
              onChange={(event) => {
                setPaymentPlan(event.target.value);
                if (event.target.value === "full") {
                  setInstallmentCount("1");
                } else if (installmentCount === "1" || installmentCount === "") {
                  setInstallmentCount("3");
                }
              }}
            >
              <option value="full">Pay full course amount</option>
              <option value="installments">Pay in installments</option>
            </select>
          </label>

          {paymentPlan === "installments" ? (
            <label className={labelClass}>
              Number of installments
              <input
                className={inputClass}
                type="number"
                min="2"
                max="24"
                step="1"
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                placeholder="e.g. 3"
              />
            </label>
          ) : (
            <div className="hidden sm:block" aria-hidden="true" />
          )}

          <label className={labelClass}>
            Rate per session
            <span className="relative mt-1.5 block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                {currency.toUpperCase()}
              </span>
              <input
                className={`${inputClass} mt-0 pl-16`}
                type="number"
                min="0.01"
                max="100000"
                step="0.01"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="0.00"
              />
            </span>
          </label>

          <label className={labelClass}>
            Currency
            <select
              className={inputClass}
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              <option value="usd">USD — US Dollar</option>
              <option value="ghs">GHS — Ghana Cedi</option>
              <option value="gbp">GBP — British Pound</option>
              <option value="eur">EUR — Euro</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
          <div>
            <p className="text-sm font-semibold text-emerald-950">Estimated course total</p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Rate per session × sessions per week × course weeks. This is an estimate based on the values entered.
            </p>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-emerald-950 sm:text-right">
            {formatMoney(estimatedTotal, currency)}
          </p>
        </div>
      </section>

    
      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <section className="sticky bottom-3 z-10 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-5">
        <p className="mb-3 text-xs leading-5 text-slate-500 sm:mb-0">
          Marking the plan as agreed records the agreement and requests learner account setup. It does not create a booking, send a payment link, or charge the family.
        </p>
        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save("save_draft")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError("");
              setConfirmAgreement(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Mark plan as agreed
          </button>
        </div>
      </section>

      {confirmAgreement ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setConfirmAgreement(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="plan-agreement-title"
            aria-describedby="plan-agreement-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="plan-agreement-title" className="text-lg font-semibold tracking-tight text-slate-900">
                  Mark this plan as agreed?
                </h3>
                <p id="plan-agreement-description" className="mt-1 text-sm leading-6 text-slate-600">
                  Confirm that the tutoring plan details have been reviewed and agreed upon.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close confirmation"
                disabled={busy}
                onClick={() => setConfirmAgreement(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-amber-900">
                  This records the agreement and requests learner account setup. It will not create a booking, send a payment link, or charge the family.
                </p>
              </div>
              {error ? (
                <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAgreement(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save("mark_agreed")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving agreement…
                  </>
                ) : (
                  "Confirm agreement"
                )}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}



// "use client";

// import { useEffect, useState } from "react";
// import { AlertTriangle, CheckCircle2, X } from "lucide-react";

// type PlanValues = {
//   subject: string;
//   learningGoals: string;
//   agreedSchedule: string;
//   sessionDurationMinutes: number | null;
//   sessionsPerWeek: number | null;
//   courseDurationWeeks?: number | null;
//   paymentPlan?: string;
//   installmentCount?: number | null;
//   agreedRateCents: number | null;
//   currency: string;
//   planNotes: string;
//   status: string;
//   paymentStatus: string;
//   planAgreedAt: string | null;
//   planAgreedByName: string | null;
// };

// type TutoringPlanEditorProps = {
//   requestId: string;
//   initial: PlanValues;
//   guardianEmail: string;
//   initialLearnerEmail: string;
//   initialBillingEmail: string;
//   learnerUserId: string | null;
//   setupSentAt: string | null;
// };

// export default function TutoringPlanEditor({
//   requestId,
//   initial,
//   guardianEmail,
//   initialLearnerEmail,
//   initialBillingEmail,
//   learnerUserId,
//   setupSentAt,
// }: TutoringPlanEditorProps) {
//   const [subject, setSubject] = useState(initial.subject);
//   const [learningGoals, setLearningGoals] = useState(initial.learningGoals);
//   const [duration, setDuration] = useState(
//     initial.sessionDurationMinutes?.toString() ?? "",
//   );
//   const [sessionsPerWeek, setSessionsPerWeek] = useState(
//     initial.sessionsPerWeek?.toString() ?? "",
//   );
//   const [courseWeeks, setCourseWeeks] = useState(
//     initial.courseDurationWeeks?.toString() ?? "",
//   );
//   const [paymentPlan, setPaymentPlan] = useState(initial.paymentPlan || "full");
//   const [installmentCount, setInstallmentCount] = useState(
//     initial.installmentCount?.toString() ?? "",
//   );
//   const [rate, setRate] = useState(
//     initial.agreedRateCents == null
//       ? ""
//       : (initial.agreedRateCents / 100).toFixed(2),
//   );
//   const [currency, setCurrency] = useState(initial.currency || "usd");
//   const [planNotes, setPlanNotes] = useState(initial.planNotes);
//   const [learnerEmail, setLearnerEmail] = useState(initialLearnerEmail);
//   const billingEmail = initialBillingEmail || guardianEmail;
//   const [busy, setBusy] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [confirmAgreement, setConfirmAgreement] = useState(false);
//   const [agreedSchedule, setAgreedSchedule] = useState(
//     initial.agreedSchedule || "",
//   );

//   useEffect(() => {
//     if (!confirmAgreement || busy) return;

//     function handleKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setConfirmAgreement(false);
//       }
//     }

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [confirmAgreement, busy]);

//   async function save(action: "save_draft" | "mark_agreed") {
//     setMessage("");
//     setError("");

//     if (action === "mark_agreed") {
//       const normalizedLearnerEmail = learnerEmail.trim().toLowerCase();
//       if (
//         !normalizedLearnerEmail ||
//         !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedLearnerEmail)
//       ) {
//         setError(
//           "Enter the learner’s own valid email address before marking the plan as agreed. The guardian/contact email cannot be used as the learner login.",
//         );
//         return;
//       }
//     }

//     setBusy(true);
//     setMessage("");
//     setError("");

//     try {
//       // Persist the learner's own login email separately from the payment recipient.
//       // This must succeed before the plan is marked agreed and account setup is requested.
//       const emailResponse = await fetch(
//         `/api/admin/tutoring-requests/${encodeURIComponent(requestId)}/emails`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           credentials: "same-origin",
//           body: JSON.stringify({
//             learnerEmail: learnerEmail.trim().toLowerCase(),
//             billingEmail: billingEmail.trim().toLowerCase(),
//           }),
//         },
//       );
//       const emailData = await emailResponse.json().catch(() => ({}));
//       if (!emailResponse.ok) {
//         throw new Error(
//           emailData.error ||
//             "Could not save the learner and payment email addresses.",
//         );
//       }

//       // Step 1: Save the tutoring plan.
//       const response = await fetch(
//         `/api/tutoring/onboarding/${encodeURIComponent(requestId)}/plan`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           credentials: "same-origin",
//           body: JSON.stringify({
//             action,
//             subject,
//             learningGoals,
//             agreedSchedule: agreedSchedule.trim(),
//             sessionDurationMinutes: duration === "" ? null : Number(duration),
//             sessionsPerWeek:
//               sessionsPerWeek === "" ? null : Number(sessionsPerWeek),
//             courseDurationWeeks:
//               courseWeeks.trim() === "" ? null : Number(courseWeeks),
//             paymentPlan,
//             installmentCount:
//               paymentPlan === "installments"
//                 ? installmentCount.trim() === ""
//                   ? null
//                   : Number(installmentCount)
//                 : 1,
//             agreedRateCents:
//               rate.trim() === "" ? null : Math.round(Number(rate) * 100),
//             currency,
//             planNotes,
//           }),
//         },
//       );

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(data.error || "Could not save the tutoring plan.");
//       }

//       // Draft saves must not create learner accounts or send setup emails.
//       if (action === "save_draft") {
//         setMessage("Plan draft saved.");
//         setConfirmAgreement(false);
//         window.location.reload();
//         return;
//       }

//       // Step 2: Request learner account setup using the separately saved learner email.
//       const accountResponse = await fetch(
//         `/api/admin/tutoring-requests/${encodeURIComponent(requestId)}/learner-account`,
//         {
//           method: "POST",
//           credentials: "same-origin",
//           headers: { "Content-Type": "application/json" },
//         },
//       );

//       const accountData = await accountResponse.json().catch(() => ({}));

//       if (!accountResponse.ok) {
//         // The plan has already been saved. Report the account setup problem
//         // without implying that the agreement itself failed.
//         setMessage(
//           `Plan agreed, but learner account setup is still pending: ${accountData.error || "Please retry account setup."}`,
//         );
//         setConfirmAgreement(false);
//         return;
//       }

//       setMessage(
//         accountData.message ||
//           "Plan agreed and learner account setup requested.",
//       );

//       setConfirmAgreement(false);
//       window.location.reload();
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "Could not complete the requested action.",
//       );
//     } finally {
//       setBusy(false);
//     }
//   }

//   const inputClass =
//     "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";

//   return (
//     <>
//       <section className="mt-5 rounded-lg border bg-emerald-950 p-3 text-white sm:p-4">
//         {/* Learner account and payment emails */}
//         <div className="mb-5">
//           <h3 className="mb-2 text-sm font-semibold">
//             Learner account & payment email
//           </h3>

//           <div className="overflow-x-auto rounded-lg border border-blue-800">
//             <table className="w-full table-fixed text-left text-xs">
//               <thead className="bg-blue-900">
//                 <tr>
//                   <th className="px-3 py-2 font-medium">
//                     Learner’s own email address
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr className="bg-blue-950">
//                   <td className="px-2 py-2 align-top">
//                     <input
//                       type="email"
//                       required
//                       value={learnerEmail}
//                       onChange={(event) => setLearnerEmail(event.target.value)}
//                       placeholder="learner@example.com"
//                       autoComplete="email"
//                       className={`${inputClass} text-slate-900`}
//                     />
//                     <p className="mt-1 text-[10px] text-slate-300">
//                       Required before marking the plan as agreed.
//                     </p>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           {learnerUserId ? (
//             <p className="mt-2 text-[11px] text-emerald-200">
//               Learner account linked
//               {setupSentAt
//                 ? ` · setup email requested ${new Date(setupSentAt).toLocaleDateString()}`
//                 : ""}
//               .
//             </p>
//           ) : null}
//         </div>

//         {/* Tutoring plan heading */}
//         <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-blue-800 pb-3">
//           <h3 className="text-sm font-semibold">Tutoring plan</h3>

//           <span className="rounded-md bg-amber-800 px-2.5 py-1 text-[11px] font-medium text-white">
//             Payment: {initial.paymentStatus.replaceAll("_", " ")}
//           </span>
//         </div>

//         {/* Agreed schedule */}
//         <div className="mt-4">
//           <label className="text-xs font-medium">
//             Agreed schedule
//             <textarea
//               className={`${inputClass} mt-1 text-slate-900`}
//               rows={2}
//               value={agreedSchedule}
//               onChange={(e) => setAgreedSchedule(e.target.value)}
//               placeholder="e.g. Mondays and Wednesdays at 4:00 PM"
//             />
//           </label>
//           <p className="mt-1 text-[10px] text-slate-500">
//             Enter the agreed days and times for the tutoring sessions.
//           </p>
//         </div>

//         {/* Compact tutoring plan table */}
//         <div className="overflow-x-auto rounded-lg border border-blue-800">
//           <table className="w-full min-w-150 table-fixed text-left text-xs">
//             <thead className="bg-blue-900">
//               <tr>
//                 <th className="w-1/4 px-3 py-2 font-medium">Subject</th>
//                 <th className="w-1/4 px-3 py-2 font-medium">Session (min)</th>
//                 <th className="w-1/4 px-3 py-2 font-medium">Sessions/week</th>
//                 <th className="w-1/4 px-3 py-2 font-medium">Course (weeks)</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-t border-blue-800">
//                 <td className="p-2">
//                   <input
//                     className={`${inputClass} text-slate-900`}
//                     value={subject}
//                     onChange={(e) => setSubject(e.target.value)}
//                     placeholder="Subject"
//                   />
//                 </td>
//                 <td className="p-2">
//                   <input
//                     className={`${inputClass} text-slate-900`}
//                     type="number"
//                     min="15"
//                     max="240"
//                     step="15"
//                     value={duration}
//                     onChange={(e) => setDuration(e.target.value)}
//                   />
//                 </td>
//                 <td className="p-2">
//                   <input
//                     className={`${inputClass} text-slate-900`}
//                     type="number"
//                     min="1"
//                     max="14"
//                     step="1"
//                     value={sessionsPerWeek}
//                     onChange={(e) => setSessionsPerWeek(e.target.value)}
//                   />
//                 </td>
//                 <td className="p-2">
//                   <input
//                     className={`${inputClass} text-slate-900`}
//                     type="number"
//                     min="1"
//                     max="104"
//                     step="1"
//                     value={courseWeeks}
//                     onChange={(e) => setCourseWeeks(e.target.value)}
//                   />
//                 </td>
//               </tr>
//             </tbody>

//             <thead className="bg-blue-900">
//               <tr>
//                 <th className="px-3 py-2 font-medium" colSpan={2}>
//                   Payment arrangement
//                 </th>
//                 <th className="px-3 py-2 font-medium">
//                   {paymentPlan === "installments"
//                     ? "Installments"
//                     : "Rate/session"}
//                 </th>
//                 <th className="px-3 py-2 font-medium">Currency</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-t border-blue-800">
//                 <td className="p-2" colSpan={2}>
//                   <select
//                     className={`${inputClass} text-slate-900`}
//                     value={paymentPlan}
//                     onChange={(e) => {
//                       setPaymentPlan(e.target.value);
//                       if (e.target.value === "full") {
//                         setInstallmentCount("1");
//                       } else if (installmentCount === "1") {
//                         setInstallmentCount("3");
//                       }
//                     }}
//                   >
//                     <option value="full">Pay full course amount</option>
//                     <option value="installments">Pay in installments</option>
//                   </select>
//                 </td>

//                 <td className="p-2">
//                   {paymentPlan === "installments" ? (
//                     <>
//                       <input
//                         className={`${inputClass} text-slate-900`}
//                         type="number"
//                         min="2"
//                         max="24"
//                         step="1"
//                         value={installmentCount}
//                         onChange={(e) => setInstallmentCount(e.target.value)}
//                       />
//                     </>
//                   ) : (
//                     <input
//                       className={`${inputClass} text-slate-900`}
//                       type="number"
//                       min="0.01"
//                       max="100000"
//                       step="0.01"
//                       value={rate}
//                       onChange={(e) => setRate(e.target.value)}
//                       placeholder="Rate"
//                     />
//                   )}
//                 </td>

//                 <td className="p-2">
//                   <select
//                     className={`${inputClass} text-slate-900`}
//                     value={currency}
//                     onChange={(e) => setCurrency(e.target.value)}
//                   >
//                     <option value="usd">USD</option>
//                     <option value="ghs">GHS</option>
//                     <option value="gbp">GBP</option>
//                     <option value="eur">EUR</option>
//                   </select>
//                 </td>
//               </tr>

//               {paymentPlan === "installments" && (
//                 <tr className="border-t border-blue-800">
//                   <td className="px-3 py-2 text-slate-200" colSpan={2}>
//                     Rate per session
//                   </td>
//                   <td className="p-2" colSpan={2}>
//                     <input
//                       className={`${inputClass} text-slate-900`}
//                       type="number"
//                       min="0.01"
//                       max="100000"
//                       step="0.01"
//                       value={rate}
//                       onChange={(e) => setRate(e.target.value)}
//                       placeholder="Rate per session"
//                     />
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Learning goals and planning notes */}
//         <div className="mt-4 grid gap-3 sm:grid-cols-2">
//           <label className="text-xs font-medium">
//             Learning goals
//             <textarea
//               className={`${inputClass} mt-1 text-slate-900`}
//               rows={2}
//               value={learningGoals}
//               onChange={(e) => setLearningGoals(e.target.value)}
//               placeholder="Goals and topics to work on"
//             />
//           </label>

//           <label className="text-xs font-medium">
//             Planning notes (optional)
//             <textarea
//               className={`${inputClass} mt-1 text-slate-900`}
//               rows={2}
//               value={planNotes}
//               onChange={(e) => setPlanNotes(e.target.value)}
//               placeholder="Additional agreed details; avoid unnecessary sensitive information"
//             />
//           </label>
//         </div>

//         {initial.planAgreedAt && (
//           <p className="mt-2 text-[10px] text-yellow-100">
//             Plan last marked agreed{" "}
//             {new Date(initial.planAgreedAt).toLocaleString()}
//             {initial.planAgreedByName ? ` by ${initial.planAgreedByName}` : ""}.
//           </p>
//         )}

//         {error && (
//           <p
//             role="alert"
//             className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
//           >
//             {error}
//           </p>
//         )}

//         {message && (
//           <p
//             role="status"
//             className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
//           >
//             {message}
//           </p>
//         )}

//         <div className="mt-4 flex flex-wrap gap-2">
//           <button
//             type="button"
//             disabled={busy}
//             onClick={() => void save("save_draft")}
//             className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50 bg-white text-emerald-950"
//           >
//             {busy ? "Saving…" : "Save plan draft"}
//           </button>

//           <button
//             type="button"
//             disabled={busy}
//             onClick={() => {
//               setError("");
//               setConfirmAgreement(true);
//             }}
//             className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
//           >
//             Mark plan as agreed
//           </button>
//         </div>

//         <p className="mt-2 text-[10px] text-yellow-100">
//           Marking the plan as agreed only records the agreement. It does not
//           create a booking, send a payment link, or charge the family.
//         </p>
//       </section>

//       {confirmAgreement && (
//         <div
//           className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget && !busy) {
//               setConfirmAgreement(false);
//             }
//           }}
//         >
//           <section
//             role="alertdialog"
//             aria-modal="true"
//             aria-labelledby="plan-agreement-title"
//             aria-describedby="plan-agreement-description"
//             className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
//           >
//             <header className="flex items-start gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
//               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
//                 <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
//               </div>

//               <div className="min-w-0 flex-1">
//                 <h3
//                   id="plan-agreement-title"
//                   className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
//                 >
//                   Mark this plan as agreed?
//                 </h3>

//                 <p
//                   id="plan-agreement-description"
//                   className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300"
//                 >
//                   Confirm that the tutoring plan terms have been agreed upon.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 aria-label="Close confirmation"
//                 disabled={busy}
//                 onClick={() => setConfirmAgreement(false)}
//                 className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
//               >
//                 <X className="h-4 w-4" aria-hidden="true" />
//               </button>
//             </header>

//             <div className="p-5">
//               <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/70 dark:bg-amber-950/30">
//                 <AlertTriangle
//                   className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
//                   aria-hidden="true"
//                 />

//                 <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
//                   This will not send a payment link or charge the family.
//                 </p>
//               </div>

//               {error && (
//                 <p
//                   role="alert"
//                   className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
//                 >
//                   {error}
//                 </p>
//               )}
//             </div>

//             <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-900/40">
//               <button
//                 type="button"
//                 disabled={busy}
//                 onClick={() => setConfirmAgreement(false)}
//                 className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 disabled={busy}
//                 onClick={() => void save("mark_agreed")}
//                 className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {busy ? (
//                   <>
//                     <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
//                     Saving agreement…
//                   </>
//                 ) : (
//                   "Confirm agreement"
//                 )}
//               </button>
//             </footer>
//           </section>
//         </div>
//       )}
//     </>
//   );
// }


