"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  CreditCard,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Props = {
  user: {
    name: string;
    email: string;
    image: string;
  };
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JU"
  );
}

export default function SettingsClient({ user }: Props) {
  const [signingOut, setSigningOut] = React.useState(false);

  const displayName = user.name || "Justdy User";

  async function signOut() {
    setSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="min-h-full bg-white text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

        {/* ====================================================== */}
        {/* HEADER                                                  */}
        {/* ====================================================== */}

        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Manage your account, billing, and workspace
                preferences.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Back to workspace
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ====================================================== */}
        {/* PROFILE CARD                                            */}
        {/* ====================================================== */}

        <section className="overflow-hidden rounded-lg border border-[#181818]/20 bg-white ">

          {/* subtle header */}
          <div className="relative h-24 overflow-hidden bg-[#181818]">
            <div className="absolute -right-12 -top-24 size-64 rounded-lg bg-[#181818] blur-3xl" />
            <div className="absolute -left-16 -bottom-28 size-64 rounded-lg bg-[#181818]blur-3xl" />
          </div>

          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-4 border-white bg-slate-100 text-lg font-bold text-slate-600 shadow-lg">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    initials(displayName)
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {displayName}
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      <span className="size-1.5 rounded-lg bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <UserRound className="size-4.5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Account information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Your basic Justdy account details.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2">

                {/* Name */}
                <div className="border-b border-slate-100 px-5 py-5 sm:border-r sm:px-6">
                  <div className="mb-2 flex items-center gap-2">
                    <UserRound className="size-3.5 text-slate-400" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Full name
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                </div>

                {/* Email */}
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Email address
                    </span>
                  </div>

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.email}
                  </p>
                </div>

                {/* Workspace */}
                <div className="px-5 py-5 sm:border-r sm:px-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="size-3.5 text-slate-400" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Workspace
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    Justdy
                  </p>
                </div>

                {/* Status */}
                <div className="px-5 py-5 sm:px-6">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-slate-400" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Account status
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-lg bg-emerald-50">
                      <span className="size-1.5 rounded-lg bg-emerald-500" />
                    </span>

                    <span className="text-sm font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* BILLING CARD                                        */}
            {/* -------------------------------------------------- */}

            <section className="overflow-hidden rounded-lg border border-violet-200 bg-linear-to-br from-violet-50 via-white to-indigo-50 shadow-[0_10px_35px_rgba(124,58,237,0.08)]">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
                      <CreditCard className="size-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-950">
                          Credits & billing
                        </h2>

                        <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
                          Account
                        </span>
                      </div>

                      <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                        Manage your credits, view billing
                        options, and choose a plan that fits
                        your creative workflow.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/credits"
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    Manage billing
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Plans
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-900">
                      Upgrade anytime
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Credits
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-900">
                      Add more when needed
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Billing
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-900">
                      Manage purchases
                    </p>
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN                                          */}
          {/* ==================================================== */}

          <div className="space-y-6">

            {/* -------------------------------------------------- */}
            {/* SECURITY                                            */}
            {/* -------------------------------------------------- */}

            <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-4.5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Security
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Your account protection status.
                  </p>
                </div>
              </div>

              <div className="p-5">

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                      <ShieldCheck className="size-4" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Account protected
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                        Your current Justdy session is
                        authenticated and active.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* HELP                                                 */}
            {/* -------------------------------------------------- */}

            <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CircleHelp className="size-4.5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Need help?
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    We are here to help.
                  </p>
                </div>
              </div>

              <div className="p-5">

                <p className="text-xs leading-5 text-slate-500">
                  Have a question about your account,
                  credits, or something in your workspace?
                </p>

                <a
                  href="mailto:support@justdy.com"
                  className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                      <Mail className="size-3.5" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Contact support
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        support@justdy.com
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="size-3.5 text-slate-400" />
                </a>
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* SIGN OUT                                             */}
            {/* -------------------------------------------------- */}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <LogOut className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-950">
                    Sign out
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sign out of your Justdy account on this
                    device.
                  </p>

                  <button
                    type="button"
                    onClick={() => void signOut()}
                    disabled={signingOut}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="size-3.5" />

                    {signingOut
                      ? "Signing out..."
                      : "Sign out"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ====================================================== */}
        {/* FOOTER                                                 */}
        {/* ====================================================== */}

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <p>
            Justdy · Creative workspace
          </p>

          <p>
            Account settings
          </p>
        </div>
      </div>
    </main>
  );
}