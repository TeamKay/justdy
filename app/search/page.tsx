
import Link from "next/link";
import { getYoutubeVideos } from "@/lib/youtube";
import SearchDynamicResults from "./SearchDynamicResults";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  GraduationCap,
  Search,
  Sparkles,
  Video,
} from "lucide-react";

import SocialNavigation from "@/app/_components/social/shared/SocialNavigation";
import {
  getGradeNumber,
  getLearningGrades,
  getLearningTopics,
} from "@/lib/learning/learning-catalog";

export const metadata = {
  title: "Search Justdy | Find Learning Resources",
  description:
    "Search Justdy for mathematics topics, learning activities, educational videos, and tutoring.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type SearchResult = {
  title: string;
  description: string;
  category: string;
  href: string;
  icon: typeof BookOpen;
};

const learningServices: SearchResult[] = [
  {
    title: "Math Lab",
    description:
      "Practise mathematics with interactive challenges, experiments, hints, and learning feedback.",
    category: "Interactive learning",
    href: "/games",
    icon: Calculator,
  },
  {
    title: "Educational Videos",
    description:
      "Watch educational explanations and explore mathematics and technology videos.",
    category: "Videos",
    href: "/videos",
    icon: Video,
  },
  {
    title: "Online Tutoring",
    description:
      "Find a tutor, get personal help, and book an online tutoring session.",
    category: "Tutoring",
    href: "/tutoring",
    icon: GraduationCap,
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesQuery(query: string, ...values: string[]) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return false;

  const searchableText = normalize(values.join(" "));

  return normalizedQuery
    .split(" ")
    .every((word) => searchableText.includes(word));
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
const [mathVideos, techVideos] = query
  ? await Promise.all([
      getYoutubeVideos("math"),
      getYoutubeVideos("tech"),
    ])
  : [[], []];

const searchableVideos = [...mathVideos, ...techVideos];
  const grades = getLearningGrades();

  const topicResults: SearchResult[] = grades.flatMap((grade) => {
    const gradeNumber = getGradeNumber(grade);

    if (gradeNumber === null) return [];

    return getLearningTopics(gradeNumber, "mathematics")
      .filter((topic) =>
        matchesQuery(
          query,
          topic.name,
          grade.label,
          "mathematics",
          "math",
          "lesson",
          "practice",
          "homework",
        ),
      )
      .map((topic) => ({
        title: topic.name,
        description: `${grade.label} Mathematics. Explore this topic and practise it through interactive Math Lab challenges.`,
        category: `${grade.label} Mathematics`,
        href: `/games?grade=${gradeNumber}&topic=${encodeURIComponent(topic.name)}`,
        icon: BookOpen,
      }));
  });

  const serviceResults = learningServices.filter((service) => {
    if (!query) return false;

    const aliases =
      service.title === "Math Lab"
        ? "math mathematics games practice questions homework problems"
        : service.title === "Educational Videos"
          ? "videos video lessons explanations watch tutorials"
          : "tutor tutors teacher help ask questions homework guidance book session";

    return matchesQuery(
      query,
      service.title,
      service.description,
      service.category,
      aliases,
    );
  });

  const gradeResults: SearchResult[] = grades
    .filter((grade) =>
      matchesQuery(query, grade.label, grade.schoolLevel, "learning pathway"),
    )
    .map((grade) => ({
      title: grade.label,
      description: `Explore the learning pathway and available subjects for ${grade.label}.`,
      category: "Grade pathway",
      href: `/learn/${grade.slug}`,
      icon: BookOpen,
    }));

  const results = [
    ...topicResults,
    ...gradeResults,
    ...serviceResults,
  ];

  const hasQuery = query.length > 0;

  return (
    <main className="min-h-screen bg-[#F7F9F6] text-[#26352D]">
      <SocialNavigation />

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-[#153F35] px-6 py-10 text-white shadow-sm sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Justdy learning search
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Find what you need to learn.
            </h1>

            <p className="mt-3 text-sm leading-7 text-emerald-50/80 sm:text-base">
              Discover mathematics topics, explore learning activities,
              watch educational videos, or find a tutor to help you.
            </p>
          </div>
        </section>

        <section className="mt-9">
          {hasQuery ? (
            <>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#47834B]">
                  Search results
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#263D2D]">
                  Results for &ldquo;{query}&rdquo;
                </h2>

                <p className="mt-2 text-sm text-[#829087]">
                  {results.length} matching{" "}
                  {results.length === 1 ? "result" : "results"} found.
                </p>
              </div>

             {results.length > 0 && (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {results.map((result, index) => {
      const Icon = result.icon;

      return (
        <Link
          key={`${result.href}-${index}`}
          href={result.href}
          className="group flex min-h-[210px] flex-col rounded-2xl border border-[#E4EBE2] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#8DBD85] hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4E6] text-[#47834B]">
              <Icon className="h-5 w-5" />
            </span>

            <span className="rounded-full bg-[#F2F6EF] px-3 py-1 text-[10px] font-bold text-[#718A70]">
              {result.category}
            </span>
          </div>

          <h3 className="mt-5 text-lg font-bold text-[#263D2D]">
            {result.title}
          </h3>

          <p className="mt-2 flex-1 text-sm leading-6 text-[#829087]">
            {result.description}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-[#EDF1EB] pt-4">
            <span className="text-xs font-bold text-[#47834B]">
              Explore resource
            </span>
            <ArrowRight className="h-4 w-4 text-[#47834B] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      );
    })}
  </div>
)}

<SearchDynamicResults
  query={query}
  videos={searchableVideos}
/>
            </>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#47834B]">
                  Explore Justdy
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#263D2D]">
                  What would you like to do today?
                </h2>

                <p className="mt-2 text-sm text-[#829087]">
                  Choose a learning activity to get started.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {learningServices.map((service) => {
                  const Icon = service.icon;

                  return (
                    <Link
                      key={service.title}
                      href={service.href}
                      className="group rounded-2xl border border-[#E4EBE2] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#8DBD85] hover:shadow-lg"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF4E6] text-[#47834B]">
                        <Icon className="h-6 w-6" />
                      </span>

                      <h3 className="mt-5 text-lg font-bold text-[#263D2D]">
                        {service.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[#829087]">
                        {service.description}
                      </p>

                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#47834B]">
                        Explore
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
