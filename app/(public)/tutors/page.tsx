"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

type TutorProfile = {
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  subjects: string[];
  gradeLevels: string[];
};

type Tutor = {
  id: string;
  name: string;
  imageUrl: string | null;
  teachingProfile: TutorProfile;
};

const currencySymbols: Record<string, string> = {
  USD: "$",
  GHS: "GH₵",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRate(rate: number | null, currency: string) {
  if (rate === null || !Number.isFinite(rate)) return "Contact for rate";
  // TeachingProfile hourlyRate is stored in the smallest currency unit.
  const amount = rate / 100;
  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}/hr`;
}

function TutorAvatar({ tutor }: { tutor: Tutor }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (tutor.imageUrl && !imageFailed) {
    return (
      // UploadThing returns a permanent public URL saved as User.imageUrl.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tutor.imageUrl}
        alt={`${tutor.name} profile`}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#FAD6AC] text-4xl font-semibold tracking-tight text-[#173B2F]">
      {initials(tutor.name)}
    </div>
  );
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTutors() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/public/tutors", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load tutors.");
        }

        if (active) {
          setTutors(Array.isArray(data?.tutors) ? data.tutors : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load tutors.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTutors();
    return () => {
      active = false;
    };
  }, []);

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(tutors.flatMap((tutor) => tutor.teachingProfile.subjects)),
      ).sort((a, b) => a.localeCompare(b)),
    [tutors],
  );

  const grades = useMemo(
    () =>
      Array.from(
        new Set(tutors.flatMap((tutor) => tutor.teachingProfile.gradeLevels)),
      ).sort((a, b) => a.localeCompare(b)),
    [tutors],
  );

  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tutors.filter((tutor) => {
      const profile = tutor.teachingProfile;
      const searchable = [
        tutor.name,
        profile.headline,
        profile.specialty,
        profile.description,
        ...profile.subjects,
        ...profile.gradeLevels,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!term || searchable.includes(term)) &&
        (subject === "all" || profile.subjects.includes(subject)) &&
        (grade === "all" || profile.gradeLevels.includes(grade))
      );
    });
  }, [tutors, search, subject, grade]);

  return (
    <main className="min-h-screen bg-[#FBF9F2] text-[#173B2F] items-center">
      <section className="relative overflow-hidden border-b border-[#eadfce]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(244,171,82,0.55) 1.1px, transparent 1.3px)",
            backgroundSize: "18px 18px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <Link
            href="/"
            className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg border border-[#e8c99f] bg-white/85 px-4 py-2 text-sm font-semibold text-[#173B2F] shadow-sm transition hover:bg-white hover:text-[#9A642F] focus:outline-none focus:ring-2 focus:ring-[#B97832] focus:ring-offset-2 sm:left-8 lg:left-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="mx-auto max-w-3xl pt-8 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-lg border border-[#e8c99f] bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A642F]">
              <Sparkles className="h-3.5 w-3.5" />
              Learn with confidence
            </div>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Meet your next
              <span className="text-[#B97832]"> great tutor.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5E6D61] sm:text-lg">
              Explore verified educators, discover the subjects they teach, and
              find the right support for your learning goals.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-5">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-3xl">
            <label className="relative sm:col-span-1">
              <span className="sr-only">Search tutors</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A968C]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, subject, keyword"
                className="h-12 w-full rounded-xl border border-[#e6ddcf] bg-white pl-10 pr-4 text-sm text-[#173B2F] outline-none transition placeholder:text-[#9AA39B] focus:border-[#B97832] focus:ring-2 focus:ring-[#B97832]/15"
              />
            </label>
            <label>
              <span className="sr-only">Filter by subject</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#e6ddcf] bg-white px-3.5 text-sm text-[#526458] outline-none focus:border-[#B97832] focus:ring-2 focus:ring-[#B97832]/15"
              >
                <option value="all">All subjects</option>
                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by grade level</span>
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#e6ddcf] bg-white px-3.5 text-sm text-[#526458] outline-none focus:border-[#B97832] focus:ring-2 focus:ring-[#B97832]/15"
              >
                <option value="all">All grade levels</option>
                {grades.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <p className="mt-2 text-sm text-[#718075]">
              {loading
                ? "Loading verified tutors…"
                : `${filteredTutors.length} ${filteredTutors.length === 1 ? "tutor" : "tutors"} to explore`}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-117.5 animate-pulse rounded-2xl border border-[#e9e1d5] bg-white"
              />
            ))}
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#ddcfbb] bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAD6AC]/60 text-[#9A642F]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">No tutors found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718075]">
              Try another search term or clear one of the filters to see more
              verified educators.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubject("all");
                setGrade("all");
              }}
              className="mt-5 rounded-full bg-[#173B2F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24523F]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredTutors.map((tutor) => {
              const profile = tutor.teachingProfile;
              return (
                <article
                  key={tutor.id}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#e9e1d5] bg-white shadow-[0_8px_28px_rgba(42,55,43,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#d8bd98] hover:shadow-[0_18px_42px_rgba(42,55,43,0.11)]"
                >
                  <div className="relative h-64 overflow-hidden bg-[#f5eadb]">
                    <TutorAvatar tutor={tutor} />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#24523F] shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#B97832]" />
                      Verified tutor
                    </div>
                    {profile.experience !== null && (
                      <div className="absolute bottom-4 right-4 rounded-full bg-[#173B2F]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        {profile.experience}{" "}
                        {profile.experience === 1 ? "year" : "years"} experience
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold tracking-tight text-[#173B2F]">
                          {tutor.name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-[#A56A2E]">
                          {profile.specialty || "Verified educator"}
                        </p>
                      </div>
                     
                    </div>

                    <div className="mt-auto pt-6">
                      <Link
                        href="/tutoring"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#173B2F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24523F] focus:outline-none focus:ring-2 focus:ring-[#B97832] focus:ring-offset-2"
                      >
                        Explore tutoring
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
