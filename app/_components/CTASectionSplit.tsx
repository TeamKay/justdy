import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASectionSplit() {
  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-neutral-900">
      {/* Structural Accent Lines */}
      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-neutral-900/40 hidden lg:block" />
      <div className="absolute right-1/4 top-0 bottom-0 w-px bg-neutral-900/40 hidden lg:block" />

      {/* Subtle Platform-Wide Orange/Amber Ambient Core Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Headings & Value Prop (Spans 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-5xl uppercase leading-[1.05]">
              Real Results <br />
              <span className="text-neutral-500">Awaits you.</span>
            </h2>

            <p className="text-neutral-400 text-base max-w-2xl mx-auto">
              Whether you need elite 1-on-1 expert consulting, 24/7 adaptive AI
              tutoring, deep-dive video masterclasses, or instant-access digital
              product toolkits—our integrated learning platform is built to
              optimize your workflow and fast-track your success parameters.
            </p>
          </div>

          {/* RIGHT COLUMN: Interactive Action Grid (Spans 5 Cols) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative rounded-md border border-neutral-800 bg-neutral-900/20 p-6 md:p-8 backdrop-blur-xs space-y-4">
              {/* Background accent blend gradient */}
              <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-50 rounded-md pointer-events-none" />

              {/* CARD 1: Primary Action (Get Started / Onboarding) */}
              <Link
                href="/tutoring"
                className="group relative flex items-center justify-between p-5 rounded-md border border-neutral-800 bg-neutral-900/80 transition-all duration-300 hover:border-orange-500/50 hover:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-black transition-colors duration-300">
                    <Sparkles className="h-5 w-5 fill-current" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white tracking-wide">
                      Start your Journey Now
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Book a session
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-orange-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
