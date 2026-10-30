"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  UserRound,
  Users,
  Phone,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

const GRADE_LEVELS = [
  "Pre-K",
  "Kindergarten",
  ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`),
  "College",
  "Adult Learner",
];

type EnrollmentType = "self" | "parent_guardian" | "other_person";

const STEPS = [
  { number: 1, title: "Who are we tutoring?", icon: Users },
  { number: 2, title: "Grade level", icon: GraduationCap },
  { number: 3, title: "Learner name", icon: UserRound },
  { number: 4, title: "Your name", icon: UserRound },
  { number: 5, title: "Contact details", icon: Phone },
  { number: 6, title: "Call time", icon: CalendarClock },
  { number: 7, title: "Review", icon: CheckCircle2 },
];

type IntakeResponse = {
  success?: boolean;
  message?: string;
  requestId?: string;
  emailConfirmationSent?: boolean;
  adminNotificationSent?: boolean;
  error?: string;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[65%] whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default function TutoringBookPage() {
  const [step, setStep] = useState(1);
  const [gradeLevel, setGradeLevel] = useState("");
  const [studentName, setStudentName] = useState("");
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType | "">("");
  // Until the API is updated, this field retains the existing guardianName payload key.
  // It represents the person making the request when that person is not the learner.
  const [guardianName, setGuardianName] = useState("");
  const [email, setEmail] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredCallDate, setPreferredCallDate] = useState("");
  const [preferredCallTime, setPreferredCallTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState({ year: 0, month: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");

  const fieldClass =
    "mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-100/80";
  const labelClass = "block text-sm font-medium text-slate-700";

  const preferredCallDateTime =
    preferredCallDate && preferredCallTime
      ? new Date(`${preferredCallDate}T${preferredCallTime}`)
      : null;

  const callDateLabel = preferredCallDateTime
    ? preferredCallDateTime.toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const [localToday, setLocalToday] = useState("");
  const [currentTimeMs, setCurrentTimeMs] = useState<number | null>(null);
  const [minCallTime, setMinCallTime] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Initialize browser-local date values after the first paint to keep
    // render pure and avoid synchronous state updates inside the effect.
    const frame = window.requestAnimationFrame(() => {
      const now = new Date();
      setCurrentTimeMs(now.getTime());
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      setLocalToday(today);
      setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });

      const minimumTime = new Date(now.getTime() + 60_000);
      const time = [
        String(minimumTime.getHours()).padStart(2, "0"),
        String(minimumTime.getMinutes()).padStart(2, "0"),
      ].join(":");

      setMinCallTime(preferredCallDate === today ? time : undefined);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [preferredCallDate]);

  const calendarMonthDate = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1,
  );
  const calendarMonthLabel = calendarMonthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const calendarOffset = calendarMonthDate.getDay();
  const daysInCalendarMonth = new Date(
    calendarMonth.year,
    calendarMonth.month + 1,
    0,
  ).getDate();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: calendarOffset }, () => null),
    ...Array.from({ length: daysInCalendarMonth }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  function changeCalendarMonth(delta: number) {
    setCalendarMonth((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function chooseCalendarDay(day: number) {
    const selected = [
      calendarMonth.year,
      String(calendarMonth.month + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
    if (selected < localToday) return;
    setPreferredCallDate(selected);
  }

  function validateCurrentStep() {
    if (step === 1 && !enrollmentType)
      return "Please choose who we are tutoring.";
    if (step === 2 && !gradeLevel)
      return "Please select the learner's grade level.";
    if (step === 3 && !studentName.trim())
      return "Please enter the learner's full name.";
    if (step === 4 && enrollmentType !== "self" && !guardianName.trim()) {
      return enrollmentType === "parent_guardian"
        ? "Please enter the parent or guardian's full name."
        : "Please enter your full name.";
    }
    if (step === 5) {
      if (!email.trim() || !phoneNumber.trim()) {
        return "Please enter your contact email address and phone number.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Please enter a valid contact email address.";
      }
    }
    if (step === 6) {
      if (!preferredCallDate || !preferredCallTime) {
        return "Please choose a date and time for the call.";
      }
      if (
        !preferredCallDateTime ||
        Number.isNaN(preferredCallDateTime.getTime()) ||
        preferredCallDateTime.getTime() <= (currentTimeMs ?? 0)
      ) {
        return "Please choose a future date and time for the call.";
      }
    }
    return "";
  }

  function goNext() {
    const error = validateCurrentStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((current) => Math.min(STEPS.length, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  async function submitIntake() {
    if (step !== 7) return;

    for (let currentStep = 1; currentStep <= 6; currentStep += 1) {
      const error = validateStep(currentStep);
      if (error) {
        setStep(currentStep);
        toast.error(error);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tutoring/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          gradeLevel,
          studentName: studentName.trim(),
          enrollmentType,
          guardianName:
            enrollmentType === "self"
              ? studentName.trim()
              : guardianName.trim(),
          email: email.trim().toLowerCase(),
          learnerEmail: learnerEmail.trim().toLowerCase() || null,
          phoneNumber: phoneNumber.trim(),
          preferredCallDateTime: preferredCallDateTime!.toISOString(),
          preferredContact: "Phone",
          additionalInfo: "",
          status: "pending_planning",
          paymentStatus: "not_requested",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as IntakeResponse;
      if (!response.ok) {
        throw new Error(
          data.error || "We couldn't submit your request. Please try again.",
        );
      }

      setRequestId(typeof data.requestId === "string" ? data.requestId : "");
      setSubmitted(true);

      if (
        data.emailConfirmationSent === false ||
        data.adminNotificationSent === false
      ) {
        toast.warning(
          data.message ||
            "Your request was saved, but an email could not be sent.",
        );
      } else {
        toast.success(
          data.message || "Your tutoring request has been submitted.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validateStep(stepNumber: number) {
    if (stepNumber === 1 && !enrollmentType)
      return "Please choose who we are tutoring.";
    if (stepNumber === 2 && !gradeLevel)
      return "Please select the learner's grade level.";
    if (stepNumber === 3 && !studentName.trim())
      return "Please enter the learner's full name.";
    if (stepNumber === 4 && enrollmentType !== "self" && !guardianName.trim()) {
      return enrollmentType === "parent_guardian"
        ? "Please enter the parent or guardian's full name."
        : "Please enter your full name.";
    }
    if (stepNumber === 5) {
      if (!email.trim() || !phoneNumber.trim())
        return "Please enter your contact email address and phone number.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return "Please enter a valid contact email address.";
    }
    if (stepNumber === 6) {
      if (!preferredCallDate || !preferredCallTime)
        return "Please choose a date and time for the call.";
      if (
        !preferredCallDateTime ||
        Number.isNaN(preferredCallDateTime.getTime()) ||
        preferredCallDateTime.getTime() <= (currentTimeMs ?? 0)
      )
        return "Please choose a future date and time for the call.";
    }
    return "";
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-4 py-12 text-slate-900">
        <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-semibold">
            Tutoring request sent!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-600">
            Thank you. We&apos;ll contact you to discuss the learner&apos;s
            needs and agree on a suitable tutoring plan. We&apos;ll collect
            learner account details and payment information during that
            discussion. No payment has been taken or requested.
          </p>
          {requestId ? (
            <p className="mt-4 text-center text-xs text-slate-500">
              Request reference: {requestId}
            </p>
          ) : null}
          <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold">What happens next?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>We review your request.</li>
              <li>
                We call at the preferred time, or contact you to arrange another
                time.
              </li>
              <li>
                We discuss the learning plan and collect any remaining details.
              </li>
              <li>
                If you agree to the plan, we send a secure payment link to the
                agreed payer.
              </li>
            </ol>
          </div>
          <div className="mt-7 text-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Back to Justdy
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/50 to-transparent"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          href="/"
          className="absolute left-4 top-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800 sm:left-8 sm:top-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>

        <div className="mx-auto w-full max-w-3xl lg:px-4">
          <header className="mb-7 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Let&apos;s plan your tutoring journey
            </h1>
            <p className="mx-auto text-center mb-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-sm">
              Tell us a little about your learner and your availability so we
              can help arrange the next steps.
            </p>
          </header>
          <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-100 px-5 pb-5 pt-4 sm:px-9 sm:pt-4">
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100"
                role="progressbar"
                aria-label="Onboarding progress"
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-valuenow={step}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-700 to-lime-500 transition-all duration-300 ease-out"
                  style={{ width: `${(step / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="p-5 sm:p-9">
              <form onSubmit={(event) => event.preventDefault()}>
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        Who are we tutoring?
                      </h1>
                    </div>
                    <fieldset className="space-y-3">
                      <legend className="sr-only">Who are we tutoring?</legend>
                      {(
                        [
                          {
                            value: "self",
                            title: "Myself",
                            detail: "I'm looking for tutoring for myself.",
                          },
                          {
                            value: "parent_guardian",
                            title: "My child",
                            detail:
                              "I'm a parent or guardian arranging tutoring for my child.",
                          },
                          {
                            value: "other_person",
                            title: "Someone else",
                            detail:
                              "I'm arranging tutoring for another person.",
                          },
                        ] as const
                      ).map((option) => (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${enrollmentType === option.value ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-300"}`}
                        >
                          <input
                            type="radio"
                            name="enrollment-type"
                            value={option.value}
                            checked={enrollmentType === option.value}
                            onChange={() => setEnrollmentType(option.value)}
                            className="mt-1 accent-emerald-800"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {option.title}
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-slate-600">
                              {option.detail}
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h1 className="mb-3 text-2xl font-semibold tracking-tight">
                      {enrollmentType === "self"
                        ? "What is your grade level?"
                        : enrollmentType === "parent_guardian"
                          ? "What is your child’s grade level?"
                          : "What is the learner’s grade level?"}
                    </h1>
                    <select
                      id="grade-level"
                      required
                      value={gradeLevel}
                      onChange={(event) => setGradeLevel(event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Choose a grade level</option>
                      {GRADE_LEVELS.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {enrollmentType === "self"
                        ? "What is your full name?"
                        : enrollmentType === "parent_guardian"
                          ? "What is your child’s full name?"
                          : "What is the learner’s full name?"}
                    </h1>
                    <label
                      htmlFor="student-name"
                      className={`${labelClass} mt-3`}
                    >
                      <span className="sr-only">
                        {enrollmentType === "self"
                          ? "Your full name"
                          : enrollmentType === "parent_guardian"
                            ? "Your child’s full name"
                            : "Learner’s full name"}
                      </span>
                      <input
                        id="student-name"
                        autoComplete="off"
                        required
                        value={studentName}
                        onChange={(event) => setStudentName(event.target.value)}
                        placeholder={
                          enrollmentType === "self"
                            ? "Enter your full name"
                            : enrollmentType === "parent_guardian"
                              ? "Enter your child’s full name"
                              : "Enter the learner’s full name"
                        }
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {enrollmentType === "parent_guardian"
                        ? "What is your name?"
                        : enrollmentType === "other_person"
                          ? "What is your name as the person arranging tutoring?"
                          : "Your details"}
                    </h1>
                    {enrollmentType === "self" ? (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-600">
                        You&apos;re requesting tutoring for yourself, so
                        we&apos;ll use the learner name you provided.
                      </p>
                    ) : (
                      <label htmlFor="guardian-name" className={labelClass}>
                        {enrollmentType === "parent_guardian"
                          ? "Parent or guardian&apos;s full name"
                          : "Your full name"}
                        <input
                          id="guardian-name"
                          autoComplete="name"
                          required
                          value={guardianName}
                          onChange={(event) =>
                            setGuardianName(event.target.value)
                          }
                          placeholder={
                            enrollmentType === "parent_guardian"
                              ? "Enter parent or guardian's full name"
                              : "Enter your full name"
                          }
                          className={fieldClass}
                        />
                      </label>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {enrollmentType === "self"
                        ? "How can we contact you?"
                        : enrollmentType === "parent_guardian"
                          ? "How can we contact you about your child’s tutoring?"
                          : "How can we contact you about the learner’s tutoring?"}
                    </h1>
                    <label htmlFor="parent-email" className={labelClass}>
                      <input
                        id="parent-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="contact@example.com"
                        className={fieldClass}
                      />
                    </label>
                    <label htmlFor="parent-phone" className={labelClass}>
                      <input
                        id="parent-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="Best phone number to reach you"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}

                {step === 6 && (
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      When can we call to discuss tutoring?
                    </h1>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                      <section
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                        aria-label="Choose a call date"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">
                              {calendarMonthLabel}
                            </h2>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => changeCalendarMonth(-1)}
                                disabled={
                                  !localToday ||
                                  `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, "0")}` <=
                                    localToday.slice(0, 7)
                                }
                                aria-label="Previous month"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => changeCalendarMonth(1)}
                                aria-label="Next month"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1 text-center">
                            {[
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                            ].map((day) => (
                              <div
                                key={day}
                                className="py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                              >
                                {day}
                              </div>
                            ))}
                            {calendarCells.map((day, index) => {
                              if (day === null)
                                return (
                                  <div
                                    key={`empty-${index}`}
                                    aria-hidden="true"
                                  />
                                );
                              const dateValue = [
                                calendarMonth.year,
                                String(calendarMonth.month + 1).padStart(
                                  2,
                                  "0",
                                ),
                                String(day).padStart(2, "0"),
                              ].join("-");
                              const disabled =
                                !localToday || dateValue < localToday;
                              const selected = preferredCallDate === dateValue;
                              const isToday = localToday === dateValue;
                              return (
                                <button
                                  key={dateValue}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => chooseCalendarDay(day)}
                                  aria-pressed={selected}
                                  aria-label={new Date(
                                    `${dateValue}T12:00:00`,
                                  ).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm transition sm:h-10 sm:w-10 ${
                                    selected
                                      ? "bg-indigo-700 font-bold text-white shadow-md shadow-indigo-200"
                                      : isToday
                                        ? "border border-indigo-300 font-bold text-indigo-700"
                                        : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-800"
                                  } disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </section>

                      <section
                        className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                        aria-label="Choose a call time"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                          <Clock3 className="h-5 w-5" /> SELECT A TIME
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {preferredCallDate
                            ? `Choose a time for ${new Date(`${preferredCallDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
                            : "Choose a date first, then set your preferred time."}
                        </p>
                        <label
                          htmlFor="preferred-call-time"
                          className={`${labelClass} mt-5`}
                        >
                          Preferred call time
                          <input
                            id="preferred-call-time"
                            type="time"
                            required
                            min={minCallTime}
                            disabled={!preferredCallDate}
                            value={preferredCallTime}
                            onChange={(event) =>
                              setPreferredCallTime(event.target.value)
                            }
                            className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                          />
                        </label>
                        <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Your selection
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {preferredCallDate
                              ? new Date(
                                  `${preferredCallDate}T12:00:00`,
                                ).toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "No date selected"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {preferredCallTime
                              ? new Date(
                                  `2000-01-01T${preferredCallTime}`,
                                ).toLocaleTimeString(undefined, {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "No time selected"}
                          </p>
                        </div>
                      </section>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {callDateLabel
                        ? `Selected call preference: ${callDateLabel}`
                        : "All times are shown in your local time zone. Your request will not confirm an appointment."}
                    </p>
                  </div>
                )}

                {step === 7 && (
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Review and submit
                    </h1>
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-950">
                        No payment is due now
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-900">
                        This request only helps us arrange a discussion.
                        We&apos;ll collect learner email, payment recipient, and
                        other tutoring-plan details during the conversation.
                      </p>
                    </div>
                    <dl className="mt-4 divide-y divide-slate-100">
                      <ReviewRow
                        label={
                          enrollmentType === "self"
                            ? "Your grade level"
                            : enrollmentType === "parent_guardian"
                              ? "Your child’s grade level"
                              : "Learner grade level"
                        }
                        value={gradeLevel}
                      />
                      <ReviewRow
                        label={
                          enrollmentType === "self"
                            ? "Your full name"
                            : enrollmentType === "parent_guardian"
                              ? "Your child’s full name"
                              : "Learner full name"
                        }
                        value={studentName}
                      />
                      <ReviewRow
                        label="Who is enrolling?"
                        value={
                          enrollmentType === "self"
                            ? "Learner enrolling themselves"
                            : enrollmentType === "parent_guardian"
                              ? "Parent or guardian"
                              : enrollmentType === "other_person"
                                ? "Someone arranging tutoring for the learner"
                                : ""
                        }
                      />
                      {enrollmentType !== "self" ? (
                        <ReviewRow
                          label={
                            enrollmentType === "parent_guardian"
                              ? "Parent / guardian name"
                              : "Organizer name"
                          }
                          value={guardianName}
                        />
                      ) : null}
                      <ReviewRow
                        label={
                          enrollmentType === "self"
                            ? "Your email / contact email"
                            : "Contact email"
                        }
                        value={email}
                      />
                      <ReviewRow
                        label={
                          enrollmentType === "self"
                            ? "Your phone number"
                            : "Contact phone number"
                        }
                        value={phoneNumber}
                      />
                      <ReviewRow
                        label="Learner email (for learner account)"
                        value={learnerEmail.trim().toLowerCase()}
                      />
                      <ReviewRow
                        label="Preferred call date and time"
                        value={callDateLabel}
                      />
                    </dl>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      Submitting asks Justdy to contact you about tutoring. It
                      does not confirm a tutoring session, create a learner
                      account, or initiate payment.
                    </p>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 1 || submitting}
                    className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:invisible"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  {step < 7 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#3f3830] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f3830] hover:shadow-md"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void submitIntake()}
                      disabled={submitting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3f3830] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f3830] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Submitting request…
                        </>
                      ) : (
                        <>
                          Submit tutoring request{" "}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
