"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApplicationStatus = "Pending" | "Verified" | "Rejected" | null;

type TutorApplicationForm = {
  headline: string;
  specialty: string;
  experience: string;
  subjects: string;
  gradeLevels: string;
  hourlyRate: string;
  credentialUrl: string;
  description: string;
};

const initialForm: TutorApplicationForm = {
  headline: "",
  specialty: "",
  experience: "",
  subjects: "",
  gradeLevels: "",
  hourlyRate: "",
  credentialUrl: "",
  description: "",
};

function normalizeStatus(value: unknown): ApplicationStatus {
  if (value === "Pending" || value === "Verified" || value === "Rejected") {
    return value;
  }

  return null;
}

function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case "Pending":
      return "Under Review";

    case "Verified":
      return "Approved";

    case "Rejected":
      return "Needs Resubmission";

    default:
      return "Not Submitted";
  }
}

function statusDescription(status: ApplicationStatus) {
  switch (status) {
    case "Pending":
      return "Your tutor application has been submitted and is waiting for administrator review. You do not need to submit it again.";

    case "Verified":
      return "Your tutor application has been approved. You can update your teaching profile below.";

    case "Rejected":
      return "Your previous tutor application was not approved. You may update your information and submit a new application for review.";

    default:
      return "Complete your teaching profile and submit it for administrator review.";
  }
}

export default function TutorApplicationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [status, setStatus] = useState<ApplicationStatus>(null);

  const [form, setForm] = useState<TutorApplicationForm>(initialForm);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/educator/profile", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          if (!cancelled) {
            setMessage("Please sign in to submit a tutor application.");
          }

          return;
        }

        if (!response.ok) {
          if (!cancelled) {
            setMessage(
              "We could not load your teaching profile. Please try again.",
            );
          }

          return;
        }

        const profile = data?.profile ?? data?.teachingProfile ?? data;

        if (!cancelled && profile) {
          setStatus(normalizeStatus(profile.verificationStatus));

          setForm({
            headline: profile.headline ?? "",

            specialty: profile.specialty ?? "",

            experience:
              profile.experience !== null && profile.experience !== undefined
                ? String(profile.experience)
                : "",

            subjects: Array.isArray(profile.subjects)
              ? profile.subjects.join(", ")
              : "",

            gradeLevels: Array.isArray(profile.gradeLevels)
              ? profile.gradeLevels.join(", ")
              : "",

            hourlyRate:
              profile.hourlyRate !== null && profile.hourlyRate !== undefined
                ? String(profile.hourlyRate / 100)
                : "",

            credentialUrl: profile.credentialUrl ?? "",

            description: profile.description ?? "",
          });
        }
      } catch (error) {
        console.error("Unable to load tutor profile:", error);

        if (!cancelled) {
          setMessage(
            "We could not load your teaching profile. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof TutorApplicationForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/educator/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,

          experience: form.experience,

          hourlyRate: form.hourlyRate,

          subjects: form.subjects
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),

          gradeLevels: form.gradeLevels
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to submit your tutor application.",
        );
      }

      if (!data?.application) {
        throw new Error(
          "The application was submitted, but no application status was returned.",
        );
      }

      const nextStatus = normalizeStatus(data.application.status);

      setStatus(nextStatus);

      setMessage(
        data.application.message ??
          "Your tutor application has been submitted for review.",
      );
    } catch (error) {
      console.error("Tutor application submission error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit your tutor application.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-sm text-muted-foreground">
          Loading your teaching profile…
        </p>
      </main>
    );
  }

  const isPending = status === "Pending";

  const isVerified = status === "Verified";

  const isRejected = status === "Rejected";

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 lg:p-10">
      <header>
        <button
          type="button"
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <h1 className="text-3xl font-semibold">
          {isVerified ? "Teaching Profile" : "Become a Tutor"}
        </h1>

        <p className="mt-2 text-muted-foreground">
          {isVerified
            ? "Your tutor application has been approved. Keep your teaching profile up to date so learners know what you offer."
            : "Complete your teaching profile and submit it for administrator review. Your account remains a learner account until your application is approved."}
        </p>
      </header>

      {status ? (
        <section className="rounded-xl border p-5" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Application status
              </p>

              <p className="mt-1 text-lg font-semibold">
                {statusLabel(status)}
              </p>
            </div>

            <span className="rounded-full border px-3 py-1 text-sm">
              {status}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {statusDescription(status)}
          </p>
        </section>
      ) : null}

      {message ? (
        <div className="rounded-xl border p-4 text-sm" aria-live="polite">
          {message}
        </div>
      ) : null}

      {isPending ? (
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Application submitted</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your application is currently being reviewed by the Justdy
            administration team. You will be able to teach once your application
            has been approved.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => router.back()}
          >
            Return
          </button>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          {isRejected ? (
            <div className="rounded-xl border p-4 text-sm">
              <p className="font-medium">Update your application</p>

              <p className="mt-1 text-muted-foreground">
                Review your information below, make any necessary changes, and
                submit it again for administrator review.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="headline" className="text-sm font-medium">
              Teaching headline
            </label>

            <input
              id="headline"
              className="w-full rounded-lg border p-3"
              placeholder="For example: Experienced Mathematics Tutor"
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              required
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="specialty" className="text-sm font-medium">
              Specialty
            </label>

            <input
              id="specialty"
              className="w-full rounded-lg border p-3"
              placeholder="For example: Algebra and Geometry"
              value={form.specialty}
              onChange={(event) => updateField("specialty", event.target.value)}
              required
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="experience" className="text-sm font-medium">
              Years of teaching experience
            </label>

            <input
              id="experience"
              className="w-full rounded-lg border p-3"
              type="number"
              min="0"
              max="80"
              step="1"
              placeholder="Years of experience"
              value={form.experience}
              onChange={(event) =>
                updateField("experience", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subjects" className="text-sm font-medium">
              Subjects
            </label>

            <input
              id="subjects"
              className="w-full rounded-lg border p-3"
              placeholder="Mathematics, Algebra, Geometry"
              value={form.subjects}
              onChange={(event) => updateField("subjects", event.target.value)}
              required
            />

            <p className="text-xs text-muted-foreground">
              Separate multiple subjects with commas.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="gradeLevels" className="text-sm font-medium">
              Grade levels
            </label>

            <input
              id="gradeLevels"
              className="w-full rounded-lg border p-3"
              placeholder="Elementary, Middle School, High School"
              value={form.gradeLevels}
              onChange={(event) =>
                updateField("gradeLevels", event.target.value)
              }
              required
            />

            <p className="text-xs text-muted-foreground">
              Separate multiple grade levels with commas.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="hourlyRate" className="text-sm font-medium">
              Hourly rate (USD)
            </label>

            <input
              id="hourlyRate"
              className="w-full rounded-lg border p-3"
              type="number"
              min="0"
              step="0.01"
              placeholder="Hourly rate"
              value={form.hourlyRate}
              onChange={(event) =>
                updateField("hourlyRate", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="credentialUrl" className="text-sm font-medium">
              Credential / portfolio URL
            </label>

            <input
              id="credentialUrl"
              className="w-full rounded-lg border p-3"
              type="url"
              placeholder="https://example.com/your-profile"
              value={form.credentialUrl}
              onChange={(event) =>
                updateField("credentialUrl", event.target.value)
              }
            />

            <p className="text-xs text-muted-foreground">
              Optional. You can provide a credential, portfolio, professional
              profile, or other supporting link.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Teaching experience and approach
            </label>

            <textarea
              id="description"
              className="min-h-40 w-full rounded-lg border p-3"
              placeholder="Tell learners about your teaching experience, qualifications, and approach."
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              required
              maxLength={4000}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Submitting…"
              : isVerified
                ? "Save Teaching Profile"
                : isRejected
                  ? "Resubmit Tutor Application"
                  : "Submit Tutor Application"}
          </button>
        </form>
      )}
    </main>
  );
}
