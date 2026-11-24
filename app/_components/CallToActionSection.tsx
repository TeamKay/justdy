
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export default function CallToActionSection() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#20242b] px-5 py-20 text-white sm:px-8 lg:py-28"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(13, 18, 25, 0.38),
            rgba(13, 18, 25, 0.48)
          ),
          url('/images/justdy-chalkboard-background.webp')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* Main message */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[#9EE66B]" />
              A stronger start begins here
            </div>

            <h2 className="mt-7 text-4xl font-chalkduster font-bold leading-[1.12] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Give your child the confidence to{" "}
              <span className="text-[#F4AB32]">
                succeed in mathematics.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg lg:mx-0">
              Every student deserves the right support to reach their
              potential. Take the first step with Justdy through personalized
              guidance, meaningful practice, and a learning experience built
              around your child&apos;s needs.
            </p>

            {/* Benefits */}
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-white/85 lg:justify-start">
              {[
                "Personalized support",
                "Build lasting confidence",
                "Learn at your own pace",
              ].map((benefit) => (
                <span key={benefit} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9EE66B]" />
                  {benefit}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/tutoring"
                className="group inline-flex h-13 w-full items-center justify-center gap-3 rounded-lg bg-[#8c9112] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-[#787a2c] hover:shadow-xl sm:w-auto"
              >
                Start Free Assessment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/videos"
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-7 py-4 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 sm:w-auto"
              >
                <BookOpen className="h-4 w-4 text-[#F4AB32]" />
                Explore Free Lessons
              </Link>
            </div>

            <p className="mt-5 text-xs font-medium text-white/60">
              Start with a conversation about your student&apos;s learning
              goals.
            </p>
          </div>

          {/* Supporting visual card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-[#F4AB32]/20 blur-2xl" />
            <div className="absolute -bottom-6 -left-5 h-32 w-32 rounded-full bg-[#147D72]/30 blur-2xl" />

            <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#151a21]/85 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-9">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9EE66B]">
                    The Justdy approach
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
                    Progress starts with support.
                  </h3>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9EE66B]/15 text-[#9EE66B]">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {[
                  {
                    number: "01",
                    title: "Understand",
                    description:
                      "Identify strengths and areas that need attention.",
                    color: "bg-[#147D72]",
                  },
                  {
                    number: "02",
                    title: "Learn",
                    description:
                      "Get guidance and explanations that make sense.",
                    color: "bg-[#76529A]",
                  },
                  {
                    number: "03",
                    title: "Grow",
                    description:
                      "Build skills through practice and consistent support.",
                    color: "bg-[#D28A43]",
                  },
                ].map((step) => (
                  <div key={step.number} className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${step.color}`}
                    >
                      {step.number}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-white/65">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold leading-6 text-white">
                  Small steps. Strong foundations. Greater confidence.
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Your learning journey starts with Justdy.
                </p>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -bottom-5 -right-3 flex items-center gap-2 rounded-xl border border-white/15 bg-[#151a21] px-4 py-3 shadow-lg sm:-right-6">
              <Sparkles className="h-5 w-5 text-[#F4AB32]" />
              <span className="text-xs font-bold text-white">
                Make learning meaningful
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
