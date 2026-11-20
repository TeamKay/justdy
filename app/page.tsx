
import Link from "next/link";
import { headers } from "next/headers";
import type { ElementType } from "react";
import { getYoutubeVideos, type Video as YouTubeVideo } from "@/lib/youtube";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  PlayCircle,
  Puzzle,
} from "lucide-react";

import { auth } from "@/lib/auth";
import MathHero from "./_components/public/MathHero";
import StatsSection from "./_components/public/StatsSection";
import MarketingFooter from "./_components/public/MarketingFooter";
import MarketingNavbar from "./_components/public/MarketingNavbar";
import TutoringSection from "./_components/public/TutoringSection";
import LatestVideosSection from "./_components/public/LatestVideosSection";

export const metadata = {
  title: "Justdy | Mathematics Help, Learning & Online Tutoring",
  description:
    "Submit mathematics questions, receive expert educator guidance, practise mathematics and connect with online tutors at Justdy.",
};

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch videos from both existing YouTube channels
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
  ]);

  // Combine, sort by publication date, and select the latest three
  const latestVideos = [...mathVideos, ...techVideos]
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt ?? "") -
        Date.parse(a.publishedAt ?? ""),
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFCF7] text-[#173B2F]">
      <MarketingNavbar />

      <main>
        <MathHero />
        <StatsSection />
        <TutoringSection />
          <LatestVideosSection videos={latestVideos} />
        <PracticeSection />

      

        <FinalCallToAction />
      </main>

      <MarketingFooter />
    </div>
  );
}



/* =====================================================
   3. ONLINE TUTORING
===================================================== */



/* =====================================================
   4. MATHEMATICS PRACTICE
===================================================== */

function PracticeSection() {
  return (
    <section
      id="math-practice"
      className="bg-[#F5F9F2] px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">

        <SectionHeading
          eyebrow="PRACTISE AND IMPROVE"
          title="Understanding grows with practice."
          description="After receiving guidance, strengthen your mathematics skills through regular practice, interactive games and educational videos."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">

          <PracticeCard
            icon={Puzzle}
            title="Mathematics Games"
            description="Challenge yourself with interactive mathematics games, puzzles and activities that make practising enjoyable."
            href="/games"
            action="Explore Math Games"
            color="green"
          />

          <PracticeCard
            icon={PlayCircle}
            title="Mathematics Videos"
            description="Revisit mathematical concepts, watch explanations and strengthen your understanding at your own pace."
            href="/videos"
            action="Explore Math Videos"
            color="orange"
          />

        </div>

      </div>
    </section>
  );
}



/* =====================================================
   6. FINAL CALL TO ACTION
===================================================== */

function FinalCallToAction() {
  return (
    <section className="bg-[#F5F9F2] px-5 py-20 sm:px-8">

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#315F3B] via-[#477D43] to-[#55984A] px-7 py-16 text-center text-white shadow-xl sm:px-14">

        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#F9D8A7]/15 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Calculator className="h-7 w-7 text-[#F9D8A7]" />
          </div>

          <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
            Don&apos;t let a difficult math problem stop you.
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/80 sm:text-base">
            Submit your question, connect with an educator or find
            an online mathematics tutor. Your next breakthrough
            could start with one question.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/questions/new"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-extrabold text-[#315F3B] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#FFF8EC]"
            >
              Submit a Math Question
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <Link
              href="/tutoring"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Find an Online Tutor
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

        </div>
      </div>
    </section>
  );
}

/* =====================================================
   7. REUSABLE COMPONENTS
===================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">

      <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#55984A]">
        {eyebrow}
      </span>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-[#193D29] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-[#788579] sm:text-base">
        {description}
      </p>

    </div>
  );
}



function PracticeCard({
  icon: Icon,
  title,
  description,
  href,
  action,
  color,
}: {
  icon: ElementType;
  title: string;
  description: string;
  href: string;
  action: string;
  color: "green" | "orange";
}) {
  const green = color === "green";

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[#E3EDE0] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
        green
          ? "bg-[#F0F8EC] text-[#55984A]"
          : "bg-[#FFF3E0] text-[#DC8725]"
      }`}>
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-6 text-xl font-extrabold text-[#263D34]">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-7 text-[#718078]">
        {description}
      </p>

      <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#55984A] transition group-hover:gap-3">
        {action}
        <ArrowRight className="h-4 w-4" />
      </span>

    </Link>
  );
}



