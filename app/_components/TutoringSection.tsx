
import {
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  Monitor,
  Users,
  Video,
  BookOpen,
  Clock3,
} from "lucide-react";
import Link from "next/link";

export default function TutoringSection() {
  return (
    <section
      id="online-tutoring"
      className="bg-[#f2f4f7] px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">

        {/* Section heading */}
        <div className="mx-auto mb-12 max-w-5xl text-center">
        
         <h1 className="font-chalkduster max-w-6xl text-balance text-[2.5rem] font-bold leading-tight tracking-normal text-[#173B2F] sm:text-2xl md:text-5xl lg:text-[2.5rem]">
         Sometimes! {" "}
          <span className="relative inline-block bg-linear-to-r from-[#55984A] via-[#70A94D] to-[#E89A42] bg-clip-text text-transparent">
            You need a tutor.
          </span>
        </h1>
        
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#718078] sm:text-lg">
            Mathematics becomes easier when you have someone to guide
            you. Get personalized support, understand difficult
            concepts, and build the confidence to succeed.
        </p>
        </div>

        {/* Main cards */}
        <div className="grid gap-4 lg:grid-cols-12">

          {/* Large tutoring card */}
          <div className="group overflow-hidden rounded-lg border border-[#E5EBE3] bg-[#FAFCF9] p-6 transition-colors hover:border-[#C9DCC4] sm:p-8 lg:col-span-8">

            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-[#263D34] sm:text-2xl">
                Online Mathematics Tutoring
              </h3>

              <span className="rounded-lg border border-[#55984A]/30 bg-[#EDF6E9] px-3 py-1 text-xs font-semibold text-[#477D43]">
                Personalized
              </span>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#718078] sm:text-base">
              Connect with dedicated mathematics educators who
              help you work through challenging topics, prepare
              for examinations, and achieve your learning goals.
            </p>

            <Link
              href="/tutoring"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#315F3B] transition-colors hover:text-[#55984A]"
            >
              Explore online tutoring
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>

            {/* Tutoring visual */}
            <div className="mt-8 overflow-hidden rounded-lg border border-[#E5EBE3] bg-white p-4 sm:p-5">

              {/* Window header */}
              <div className="flex items-center justify-between border-b border-[#EEF1EC] pb-4">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D8E2D4]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D8E2D4]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D8E2D4]" />
                </div>

                <span className="text-[10px] font-bold tracking-widest text-[#A0AAA0]">
                  JUSTDY LEARNING SESSION
                </span>
              </div>

              <div className="grid gap-3 py-5 sm:grid-cols-[1fr_1.5fr]">

                {/* Learning topic */}
                <div className="flex flex-col justify-center rounded-lg bg-[#F3F8F0] p-5">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#55984A]/15 text-[#55984A]">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#879287]">
                    Today&apos;s learning topic
                  </p>

                  <h4 className="mt-2 text-2xl font-black text-[#315F3B]">
                    Algebra
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-[#879287]">
                    Understanding equations, expressions and
                    mathematical relationships.
                  </p>
                </div>

                {/* Session preview */}
                <div className="flex min-h-48 flex-col justify-between rounded-lg border border-[#E8EEE5] bg-[#FAFCF9] p-5">

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#879287]">
                      LEARNING SESSION
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-[#EDF6E9] px-2.5 py-1 text-[10px] font-bold text-[#477D43]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#55984A]" />
                      CONNECTED
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-5 py-5">

                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#E6F1E1] text-[#55984A]">
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#718078]">
                        Educator
                      </p>
                    </div>

                    <div className="h-px w-10 bg-[#DCE5D8]" />

                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F9EEDC] text-[#B47B32]">
                        <Users className="h-7 w-7" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#718078]">
                        Learner
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center justify-between border-t border-[#E8EEE5] pt-3">
                    <span className="text-xs text-[#879287]">
                      One-on-one learning
                    </span>
                    <Video className="h-4 w-4 text-[#55984A]" />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Right learning support card */}
          <div className="group flex flex-col overflow-hidden rounded-lg border border-[#E5EBE3] bg-[#FAFCF9] p-6 transition-colors hover:border-[#C9DCC4] sm:p-8 lg:col-span-4">

            <h3 className="text-xl font-bold text-[#263D34] sm:text-2xl">
              Learning that works for you.
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#718078]">
              Whether you are strengthening your foundations
              or preparing for an important examination, get
              the support you need to move forward.
            </p>

            <Link
              href="/tutoring"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#315F3B] transition-colors hover:text-[#55984A]"
            >
              Find your learning support
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>

            {/* Benefits */}
            <div className="mt-auto space-y-3 pt-9">

              {[
                {
                  icon: CheckCircle2,
                  title: "Personalized guidance",
                  description: "Support built around your needs",
                },
                {
                  icon: Clock3,
                  title: "Flexible learning",
                  description: "Learn at your own pace",
                },
                {
                  icon: BookOpen,
                  title: "Better understanding",
                  description: "Master difficult concepts",
                },
                {
                  icon: Monitor,
                  title: "Online sessions",
                  description: "Learn wherever you are",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-xl border border-[#E8EEE5] bg-white p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF6E9] text-[#55984A]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#354B3C]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[#879287]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
