import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const reportTypes = [
  {
    title: "Learning Progress",
    description:
      "Understand how your learning is progressing across activities, resources, and assessments.",
    icon: TrendingUp,
    href: "/learn",
    badge: "Learning",
  },
  {
    title: "Assessment Performance",
    description:
      "Review quiz and assessment performance, scores, strengths, and areas that need more practice.",
    icon: ClipboardCheck,
    href: "/learn",
    badge: "Assessments",
  },
  {
    title: "Learning Insights",
    description:
      "Turn your activity into useful insights about progress, consistency, and learning patterns.",
    icon: Brain,
    href: "/learn",
    badge: "AI Insights",
  },
  {
    title: "Resource Activity",
    description:
      "See how your educational resources are being created, organized, and used.",
    icon: BookOpen,
    href: "/library",
    badge: "Resources",
  },
];

const metrics = [
  {
    label: "Learning activity",
    value: "Coming soon",
    description: "Track your learning activity over time.",
    icon: TrendingUp,
  },
  {
    label: "Assessment performance",
    value: "Coming soon",
    description: "Monitor scores and assessment results.",
    icon: Target,
  },
  {
    label: "Resources created",
    value: "Coming soon",
    description: "Measure your educational creation activity.",
    icon: Sparkles,
  },
  {
    label: "Teaching activity",
    value: "Coming soon",
    description: "Track your teaching and tutoring activity.",
    icon: GraduationCap,
  },
];

export default function ReportsPage() {
  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Justdy Reports
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Understand your progress.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Reports bring your learning, assessment, creation, and teaching
                activity together so you can understand what is happening and
                decide what to do next.
              </p>
            </div>

            <Link
              href="/learn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Go to Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Overview</h2>

            <p className="mt-1 text-sm text-slate-500">
              Your most important activity will appear here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Building
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-600">
                    {metric.label}
                  </p>

                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                    {metric.value}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main report workspace */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Your report center
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Justdy will use your learning and education activity to
                  produce reports that are useful rather than simply showing raw
                  numbers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
            {reportTypes.map((report) => {
              const Icon = report.icon;

              return (
                <Link
                  key={report.title}
                  href={report.href}
                  className="group bg-white p-6 transition hover:bg-slate-50 sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {report.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-sm font-semibold text-slate-950">
                    {report.title}
                  </h3>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    {report.description}
                  </p>

                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* AI insights */}
        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                Reports should tell you what to do next.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Justdy is designed to move beyond dashboards. As your learning
                history grows, reports can identify patterns, highlight areas
                for improvement, and recommend useful next steps.
              </p>

              <Link
                href="/chat"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:underline"
              >
                Ask Justdy AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                Example insight
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                “You are consistently performing well in addition and
                subtraction. Multiplication facts appear to need more practice.”
              </p>

              <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <Target className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-950">
                      Recommended next step
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Practice multiplication facts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem reports */}
        <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Users className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight">
                One education record. Many perspectives.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                As Justdy grows, reports will connect learning, teaching,
                tutoring, resources, courses, and assessments into one
                continuous education record.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
              {["Learn", "Practice", "Assess", "Improve"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center"
                >
                  <p className="text-xs font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
