"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export function StudioShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0c] text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-5 sm:px-7">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Home
        </Link>
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 backdrop-blur-xl sm:flex">
          {icon ?? <Sparkles className="size-3.5" />}
          {title}
        </div>
      </header>
      <div
        className="relative min-h-screen px-4 pb-8 pt-20 sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.06),transparent_38%)]" />
        <section className="relative z-10 mx-auto w-full max-w-5xl">{children}</section>
      </div>
    </main>
  );
}
