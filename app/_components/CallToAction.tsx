import Link from "next/link";
import { ArrowRight, Play, Sparkles, Terminal } from "lucide-react";

export default function CTASectionSplit() {
  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-neutral-900">
      {/* Structural Accent Lines */}
      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-neutral-900/40 hidden lg:block" />
      <div className="absolute right-1/4 top-0 bottom-0 w-px bg-neutral-900/40 hidden lg:block" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Headings & Value Prop (Spans 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs font-mono text-neutral-400">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              <span>Take Your First Step</span>
            </div>

            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl uppercase">
              Unlock Your <br />
              <span className="text-neutral-500">Math Potential</span>
            </h2>

            <p className="max-w-xl text-neutral-400 text-base md:text-lg leading-relaxed font-light">
              Join a group of professionals with more than a decade of
              experience in mathematics, making complex concepts easier for all.
              Ready to improve your grades? You are at the right place. Reserve
              your spot now!
            </p>
          </div>

          {/* RIGHT COLUMN: Interactive Action Grid (Spans 5 Cols) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative rounded-md border border-neutral-800 bg-neutral-900/20 p-6 md:p-8 backdrop-blur-xs space-y-4">
              {/* Subtle background gradient to add a hint of texture */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-transparent opacity-50 rounded-md pointer-events-none" />

              {/* CARD 1: Primary Action (Get Started) */}
              <Link
                href="/onboarding"
                className="group relative flex items-center justify-between p-5 rounded-md border border-neutral-800 bg-neutral-900/80 transition-all duration-300 hover:border-amber-500/50 hover:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors duration-300">
                    <Sparkles className="h-5 w-5 fill-current" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white tracking-wide">
                      Start Your Learning Journey
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Secure your spot now
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-500" />
              </Link>

              {/* CARD 2: Secondary Action (Free Courses) */}
              <Link
                href="/ourapproach"
                className="group relative flex items-center justify-between p-5 rounded-md border border-neutral-900/40 bg-neutral-950/40 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white transition-colors duration-300">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-300">
                      Explore Our Approach
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Learn more about what we do
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-700 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-neutral-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
