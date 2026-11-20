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
      return "Your teaching profile is waiting for administrator review. You can continue editing and saving your information while you wait. Teaching tools become available after approval.";

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

  const [canManageProfile, setCanManageProfile] = useState(false);

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

        const role = data?.user?.role;
        const accountStatus = data?.user?.status;

        if (role === "LEARNER") {
          router.replace("/tutor/register");
          return;
        }

        if (
          (role !== "TUTOR" && role !== "ADMIN") ||
          accountStatus !== "Active"
        ) {
          if (!cancelled) {
            setMessage(
              accountStatus !== "Active"
                ? "Your account is not active. Please contact Justdy support."
                : "Only registered tutors and administrators can manage a teaching profile.",
            );
          }
          return;
        }

        const profile = data?.profile ?? data?.teachingProfile ?? null;

        if (!cancelled) {
          setCanManageProfile(true);
        }

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
  }, [router]);

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
      <main className="min-h-screen bg-[#F5F8FF] px-5 py-16">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-5 w-24 rounded bg-blue-100" />
          <div className="h-12 w-72 rounded-xl bg-blue-100" />
          <div className="h-64 rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  const isPending = status === "Pending";
  const isVerified = status === "Verified";
  const isRejected = status === "Rejected";

  if (!canManageProfile) {
    return (
      <main className="min-h-screen bg-[#F5F8FF] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🎓
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Teaching Profile
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500" aria-live="polite">
            {message ?? "Your account cannot manage a teaching profile."}
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            Return to Justdy
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FF] px-4 py-10 text-slate-800 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.5fr] lg:items-start">
          {/* Introduction panel */}
          <aside className="space-y-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <span>✨</span>
                TEACH WITH JUSTDY
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Share what you know.
                <span className="block text-blue-600">
                  Inspire what’s next.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-8 text-slate-500">
                Create your teaching profile and help learners build
                confidence, understand difficult concepts, and achieve more.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                🎓
              </div>

              <h2 className="mt-5 text-xl font-extrabold">
                Your knowledge matters.
              </h2>

              <p className="mt-2 text-sm leading-7 text-blue-100">
                Tell learners what you teach, who you teach, and how you make
                learning easier to understand.
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-5">
                <div className="flex -space-x-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-600 bg-orange-300 text-sm">
                    📚
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-600 bg-cyan-300 text-sm">
                    ✏️
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-600 bg-yellow-300 text-sm">
                    💡
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-100">
                  Teach. Connect. Make a difference.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900">
                What happens next?
              </h3>

              <div className="mt-5 space-y-5">
                {[
                  {
                    number: "01",
                    title: "Complete your profile",
                    description: "Tell us about your subjects and experience.",
                  },
                  {
                    number: "02",
                    title: "Administrator review",
                    description: "Our team reviews your teaching information.",
                  },
                  {
                    number: "03",
                    title: "Start teaching",
                    description: "Access teaching tools after approval.",
                  },
                ].map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                      {step.number}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Application form */}
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
            <div className="border-b border-slate-100 px-6 py-7 sm:px-9">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Tutor application
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Your teaching profile
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    A few details will help learners discover you.
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                  🍊
                </div>
              </div>

              {status && (
                <div
                  className={`mt-6 rounded-2xl border p-4 ${
                    isVerified
                      ? "border-emerald-200 bg-emerald-50"
                      : isPending
                        ? "border-amber-200 bg-amber-50"
                        : "border-orange-200 bg-orange-50"
                  }`}
                  aria-live="polite"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {isVerified ? "🎉" : isPending ? "⏳" : "📝"}
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Application status
                      </p>
                      <p className="mt-0.5 font-extrabold text-slate-900">
                        {statusLabel(status)}
                      </p>
                    </div>
                    <span className="ml-auto rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-600">
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {statusDescription(status)}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={submit} className="space-y-8 px-6 py-7 sm:px-9 sm:py-9">
              {message && (
                <div
                  className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800"
                  aria-live="polite"
                >
                  {message}
                </div>
              )}

              {isPending && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Your profile is being reviewed
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    You can still update your information. Changes will not
                    bypass administrator approval.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-bold text-orange-900">
                    Let&apos;s improve your application
                  </p>
                  <p className="mt-1 text-sm leading-6 text-orange-800">
                    Review your details and submit the updated profile for
                    another review.
                  </p>
                </div>
              )}

              {/* Section: Introduction */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
                    👋
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Introduce yourself
                    </h3>
                    <p className="text-xs text-slate-500">
                      Help learners understand who you are.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="headline" className="mb-2 block text-sm font-bold text-slate-700">
                      Teaching headline
                    </label>
                    <input
                      id="headline"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="e.g. Experienced Mathematics Tutor"
                      value={form.headline}
                      onChange={(event) => updateField("headline", event.target.value)}
                      required
                      maxLength={160}
                    />
                  </div>

                  <div>
                    <label htmlFor="specialty" className="mb-2 block text-sm font-bold text-slate-700">
                      Specialty
                    </label>
                    <input
                      id="specialty"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="e.g. Algebra, Geometry and Calculus"
                      value={form.specialty}
                      onChange={(event) => updateField("specialty", event.target.value)}
                      required
                      maxLength={160}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section: Teaching details */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg">
                    📚
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Your teaching experience
                    </h3>
                    <p className="text-xs text-slate-500">
                      Share your expertise and the learners you support.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience" className="mb-2 block text-sm font-bold text-slate-700">
                      Years of experience
                    </label>
                    <input
                      id="experience"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      type="number"
                      min="0"
                      max="80"
                      step="1"
                      placeholder="e.g. 5"
                      value={form.experience}
                      onChange={(event) => updateField("experience", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="mb-2 block text-sm font-bold text-slate-700">
                      Hourly rate (USD)
                    </label>
                    <input
                      id="hourlyRate"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 35.00"
                      value={form.hourlyRate}
                      onChange={(event) => updateField("hourlyRate", event.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="subjects" className="mb-2 block text-sm font-bold text-slate-700">
                      Subjects you teach
                    </label>
                    <input
                      id="subjects"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Mathematics, Algebra, Geometry"
                      value={form.subjects}
                      onChange={(event) => updateField("subjects", event.target.value)}
                      required
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Separate multiple subjects with commas.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="gradeLevels" className="mb-2 block text-sm font-bold text-slate-700">
                      Grade levels
                    </label>
                    <input
                      id="gradeLevels"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Elementary, Middle School, High School"
                      value={form.gradeLevels}
                      onChange={(event) => updateField("gradeLevels", event.target.value)}
                      required
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Separate multiple grade levels with commas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Section: Credentials */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">
                    🏅
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Credentials and background
                    </h3>
                    <p className="text-xs text-slate-500">
                      Give learners more reasons to trust your expertise.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="credentialUrl" className="mb-2 block text-sm font-bold text-slate-700">
                    Credential or portfolio URL
                    <span className="ml-2 font-normal text-slate-400">Optional</span>
                  </label>
                  <input
                    id="credentialUrl"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    type="url"
                    placeholder="https://example.com/your-profile"
                    value={form.credentialUrl}
                    onChange={(event) => updateField("credentialUrl", event.target.value)}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    You can share a professional profile, certificate, portfolio,
                    or other supporting link.
                  </p>
                </div>

                <div className="mt-5">
                  <label htmlFor="description" className="mb-2 block text-sm font-bold text-slate-700">
                    Teaching experience and approach
                  </label>
                  <textarea
                    id="description"
                    className="min-h-40 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Tell learners about your teaching experience, qualifications, and how you make difficult topics easier to understand."
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    required
                    maxLength={4000}
                  />
                  <p className="mt-2 text-right text-xs text-slate-400">
                    {form.description.length}/4000 characters
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex gap-3">
                  <span className="text-xl">💡</span>
                  <p className="text-xs leading-6 text-slate-600">
                    <strong className="text-slate-800">A helpful tip:</strong>{" "}
                    Be specific about your teaching strengths and the learners
                    you enjoy supporting. A clear profile helps learners know
                    whether you are the right tutor for them.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving your profile…
                  </>
                ) : (
                  <>
                    {isVerified
                      ? "Save Teaching Profile"
                      : isPending
                        ? "Update Teaching Profile"
                        : isRejected
                          ? "Resubmit Tutor Application"
                          : "Submit Tutor Application"}
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Your information is submitted securely to Justdy for review.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}