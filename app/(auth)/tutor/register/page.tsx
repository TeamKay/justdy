
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type ApplicationForm = {
  name: string;
  email: string;
  phoneNumber: string;
  headline: string;
  specialty: string;
  experience: string;
  credentialUrl: string;
  description: string;
  hourlyRate: string;
  currency: "USD" | "GHS";
  subjects: string;
  gradeLevels: string;
};

const initialForm: ApplicationForm = {
  name: "",
  email: "",
  phoneNumber: "",
  headline: "",
  specialty: "",
  experience: "",
  credentialUrl: "",
  description: "",
  hourlyRate: "",
  currency: "USD",
  subjects: "",
  gradeLevels: "",
};

const inputClass =
  "w-full rounded-xl border border-[#DCE4DE] bg-white px-4 py-3 text-sm text-[#173B2F] outline-none transition placeholder:text-[#9AA79F] focus:border-[#28734C] focus:ring-2 focus:ring-[#28734C]/10";

const labelClass = "mb-2 block text-sm font-medium text-[#30483B]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#89958D]">{hint}</p>}
    </div>
  );
}

export default function TutorRegisterPage() {
  const { data: session, isPending: sessionPending } =
    authClient.useSession();

  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");

  const user = session?.user;

  function updateField(
    field: keyof ApplicationForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (!form.name.trim() && !user) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!form.email.trim() && !user) {
      toast.error("Please enter your email address.");
      return;
    }

    const subjects = form.subjects
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const gradeLevels = form.gradeLevels
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.headline.trim()) {
      toast.error("Please enter your teaching headline.");
      return;
    }

    if (!form.specialty.trim()) {
      toast.error("Please enter your teaching specialty.");
      return;
    }

    if (!subjects.length) {
      toast.error("Please enter at least one subject.");
      return;
    }

    if (!gradeLevels.length) {
      toast.error("Please enter at least one grade level.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Please tell us about your teaching experience.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/tutor-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim(),
          headline: form.headline.trim(),
          specialty: form.specialty.trim(),
          experience: form.experience,
          credentialUrl: form.credentialUrl.trim(),
          description: form.description.trim(),
          hourlyRate: form.hourlyRate,
          currency: form.currency,
          subjects,
          gradeLevels,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(
            result.error || "An application already exists for this account.",
          );
        } else {
          toast.error(
            result.error || "Unable to submit your application.",
          );
        }
        return;
      }

      setApplicationId(result.application?.id || "");
      setSubmitted(true);

      toast.success("Your tutor application has been submitted.");
    } catch (error) {
      console.error("Tutor application submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F8FAF8] px-5 py-12 text-[#173B2F]">
        <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-[#DCE9DF] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3ED]">
              <CheckCircle2 className="h-9 w-9 text-[#28734C]" />
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#28734C]">
              Application received
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Thank you for applying!
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#68786F]">
              Your application has been successfully submitted. Our team will
              review your information and contact you by email with an update.
            </p>

            <div className="mt-8 rounded-2xl border border-[#DCE9DF] bg-[#F5F9F6] p-5 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#28734C]" />
                <div>
                  <p className="text-sm font-semibold text-[#173B2F]">
                    What happens next?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#617168]">
                    Your application is currently pending review. Teaching
                    access is only granted after an administrator approves
                    your application.
                  </p>
                </div>
              </div>
            </div>

            {applicationId && (
              <p className="mt-5 text-xs text-[#89958D]">
                Application reference: {applicationId}
              </p>
            )}

            <Link
              href="/"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#246044] px-7 text-sm font-semibold text-white transition hover:bg-[#194C35]"
            >
              Return to Justdy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF8] px-4 py-8 text-[#173B2F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173B2F] text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Justdy</span>
          </Link>

          <Link
            href={user ? "/" : "/auth?mode=signin"}
            className="text-sm font-medium text-[#52645A] transition hover:text-[#173B2F]"
          >
            {user ? "Back to Justdy" : "Already have an account? Sign in"}
          </Link>
        </header>

        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EAF3ED] px-3 py-1.5 text-xs font-semibold text-[#246044]">
            <GraduationCap className="h-4 w-4" />
            BECOME A JUSTDY TUTOR
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us about yourself.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68786F]">
            We would love to learn about your teaching background, expertise,
            and the learners you can help. Complete the application below to
            get started.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#DCE9DF] bg-[#F0F6F1] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#28734C]" />
            <div>
              <h2 className="text-sm font-semibold">
                Applications are reviewed before teaching access is granted
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#617168]">
                Submitting this application does not create a tutor account
                or change your existing account permissions. Our administrator
                will review your application before granting teaching access.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-[#E3EAE4] bg-white p-5 shadow-sm sm:p-9"
        >
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Personal information</h2>
              <p className="mt-1 text-sm text-[#89958D]">
                How can we identify and contact you?
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required>
                <input
                  value={user ? user.name || "" : form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required={!user}
                  readOnly={!!user}
                  className={`${inputClass} ${user ? "bg-[#F5F8F5]" : ""}`}
                />
              </Field>

              <Field label="Email address" required>
                <input
                  type="email"
                  value={user ? user.email || "" : form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required={!user}
                  readOnly={!!user}
                  className={`${inputClass} ${user ? "bg-[#F5F8F5]" : ""}`}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Phone number">
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      updateField("phoneNumber", e.target.value)
                    }
                    placeholder="Your contact number (optional)"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="border-t border-[#EDF0ED]" />

          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Teaching expertise</h2>
              <p className="mt-1 text-sm text-[#89958D]">
                Tell us what you teach and who you teach.
              </p>
            </div>

            <div className="space-y-5">
              <Field
                label="Teaching headline"
                required
                hint="A short introduction that describes you as an educator."
              >
                <input
                  value={form.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  placeholder="e.g. Experienced Mathematics Tutor"
                  maxLength={160}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Teaching specialty" required>
                <input
                  value={form.specialty}
                  onChange={(e) => updateField("specialty", e.target.value)}
                  placeholder="e.g. Mathematics, Algebra, Calculus"
                  maxLength={160}
                  required
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Years of teaching experience">
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={form.experience}
                    onChange={(e) =>
                      updateField("experience", e.target.value)
                    }
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                </Field>

                <Field label="Credential or portfolio URL">
                  <input
                    type="url"
                    value={form.credentialUrl}
                    onChange={(e) =>
                      updateField("credentialUrl", e.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Subjects you can teach"
                required
                hint="Separate multiple subjects with commas."
              >
                <input
                  value={form.subjects}
                  onChange={(e) => updateField("subjects", e.target.value)}
                  placeholder="e.g. Mathematics, Algebra, Geometry, Statistics"
                  required
                  className={inputClass}
                />
              </Field>

              <Field
                label="Grade levels or learner groups"
                required
                hint="Separate multiple levels with commas."
              >
                <input
                  value={form.gradeLevels}
                  onChange={(e) =>
                    updateField("gradeLevels", e.target.value)
                  }
                  placeholder="e.g. Elementary, Middle School, High School, College"
                  required
                  className={inputClass}
                />
              </Field>

              <Field
                label="Tell us about your teaching experience"
                required
                hint="Describe your background, teaching approach, qualifications, and how you help learners."
              >
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Introduce yourself and explain what makes you an effective tutor..."
                  rows={6}
                  maxLength={4000}
                  required
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-[#89958D]">
                  {form.description.length}/4000
                </p>
              </Field>
            </div>
          </section>

          <div className="border-t border-[#EDF0ED]" />

          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Teaching rate <span className="font-normal text-[#89958D]">(optional)</span>
              </h2>
              <p className="mt-1 text-sm text-[#89958D]">
                You can provide an indicative hourly rate.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Hourly rate">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(e) =>
                    updateField("hourlyRate", e.target.value)
                  }
                  placeholder="e.g. 25.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={(e) =>
                    updateField(
                      "currency",
                      e.target.value as "USD" | "GHS",
                    )
                  }
                  className={inputClass}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="GHS">GHS — Ghanaian Cedi</option>
                </select>
              </Field>
            </div>
          </section>

          <div className="border-t border-[#EDF0ED] pt-6">
            <button
              type="submit"
              disabled={submitting || sessionPending}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#246044] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#194C35] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting application...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-[#89958D]">
              By submitting, you confirm that the information provided is
              accurate. Your application will be reviewed by the Justdy team.
            </p>
          </div>
        </form>

        <footer className="py-8 text-center text-xs text-[#89958D]">
          © {new Date().getFullYear()} Justdy. Learn. Share. Grow.
        </footer>
      </div>
    </main>
  );
}
