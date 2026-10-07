
"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function StudioShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden bg-white text-foreground">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-8 lg:px-15">
        <button
          type="button"
          onClick={() => router.push("/dashboard/create")}
          className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <span className="hidden sm:inline">Back to Create</span>
        </button>

        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-muted">
          {icon ?? <Sparkles className="size-3.5" />}
          {title}
        </div>
      </header>

      {/* Full-screen centered workspace */}
      <div
        className="relative flex min-h-screen items-center justify-center px-4 py-20 sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="pointer-events-none absolute inset-0" />

        <section className="relative z-10 w-full max-w-5xl">
          {children}
        </section>
      </div>
    </main>
  );
}
