"use client";

import Link from "next/link";
import { ArrowRight, Headphones, Radio, Video } from "lucide-react";

export default function AdminLiveHelpButton() {
  return (
    <Link
      href="/admin/live-help"
      className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Headphones className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">Live Homework Help</h3>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <Radio className="h-2.5 w-2.5" />
              Live
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor live requests and enter a student classroom.
          </p>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
    </Link>
  );
}
