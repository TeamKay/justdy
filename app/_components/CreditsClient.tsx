"use client";

import * as React from "react";
import Link from "next/link";

import { CREDIT_PACKS } from "@/lib/credits/packages";
import JustdyCheckout from "@/app/_components/checkout/JustdyCheckout";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";

type Props = {
  userName: string;
};

type BillingView = "plans" | "credits";

function formatCredits(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatPricePerCredit(cents: number, credits: number) {
  if (!credits) return "$0.00";

  const price = cents / 100 / credits;

  return `$${price.toFixed(2)}`;
}

export default function CreditsClient({ userName }: Props) {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  /*
   * Billing navigation
   */
  const [view, setView] =
    React.useState<BillingView>("plans");


  const [selectedPack, setSelectedPack] =
    React.useState<string | null>(
      CREDIT_PACKS.find((pack) => pack.featured)?.key ??
        CREDIT_PACKS[0]?.key ??
        null,
    );

  const [purchasing, setPurchasing] =
    React.useState<string | null>(null);

  const [checkoutOpen, setCheckoutOpen] =
    React.useState(false);

  const [checkoutClientSecret, setCheckoutClientSecret] =
    React.useState<string | null>(null);

  const [checkoutAmount, setCheckoutAmount] =
    React.useState<number | null>(null);

  const [checkoutEmail, setCheckoutEmail] =
    React.useState("");

  /*
   * Load current credit balance.
   */
  const loadBalance = React.useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          "/api/credits/balance",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const data = (await response.json()) as {
          balance?: unknown;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load your credit balance.",
          );
        }

        const nextBalance = Number(
          data.balance ?? 0,
        );

        if (!Number.isFinite(nextBalance)) {
          throw new Error(
            "The credit balance returned by Justdy is invalid.",
          );
        }

        setBalance(nextBalance);
      } catch (loadError) {
        console.error(
          "Failed to load Justdy credits:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your credit balance.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBalance();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadBalance]);

  /*
   * Start checkout for a selected credit pack.
   */
  async function purchaseCredits(packKey: string) {
    setPurchasing(packKey);
    setError("");

    try {
      const response = await fetch(
        "/api/credits/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            pack: packKey,
          }),
        },
      );

      const data = (await response.json()) as {
        clientSecret?: string;
        customerEmail?: string;
        amount?: number;
        error?: string;
      };

      if (!response.ok || !data.clientSecret) {
        throw new Error(
          data.error ||
            "Unable to start credit checkout.",
        );
      }

      setCheckoutClientSecret(
        data.clientSecret,
      );

      setCheckoutAmount(
        typeof data.amount === "number"
          ? data.amount
          : null,
      );

      setCheckoutEmail(
        typeof data.customerEmail === "string"
          ? data.customerEmail
          : "",
      );

      setCheckoutOpen(true);
    } catch (purchaseError) {
      console.error(
        "Credit purchase checkout failed:",
        purchaseError,
      );

      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Unable to start credit checkout.",
      );
    } finally {
      setPurchasing(null);
    }
  }

  /*
   * Close Stripe / Justdy checkout.
   */
  function closeCheckout() {
    setCheckoutOpen(false);
    setCheckoutClientSecret(null);
    setCheckoutAmount(null);
    setCheckoutEmail("");
  }

  /*
   * Currently selected pack.
   */
  const selectedCreditPack =
    CREDIT_PACKS.find(
      (pack) => pack.key === selectedPack,
    ) ?? null;

  return (
    <main className="min-h-full bg-white text-slate-950">
      <div className="mx-auto min-h-full w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">

        {/* ===================================================== */}
        {/* TOP NAVIGATION                                        */}
        {/* ===================================================== */}

        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />

            Back to workspace
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
              <span className="text-slate-400">
                Welcome,
              </span>

              <span className="font-medium text-slate-800">
                {userName
                  ? userName.split(" ")[0]
                  : "Justdy"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadBalance(true)
              }
              disabled={refreshing}
              aria-label="Refresh credit balance"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* PAGE HEADER                                           */}
        {/* ===================================================== */}

        <header className="mx-auto mt-0 max-w-3xl text-center sm:mt-0">
          
          {/* Current balance */}
          <div className="mx-auto mt-0 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-[#181818] px-10 py-2.5 shadow-sm">
            

            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                Available balance
              </p>

              <p className="text-sm font-bold text-amber-500">
                {loading
                  ? "Checking balance..."
                  : `${formatCredits(
                      balance ?? 0,
                    )} credits`}
              </p>
            </div>
          </div>
        </header>

        {/* ===================================================== */}
        {/* ERROR                                                 */}
        {/* ===================================================== */}

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-lg px-4 py-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================== */}
        {/* PLAN / CREDIT SWITCHER                                */}
        {/* ===================================================== */}

        <div className="mx-auto mt-5 max-w-5xl">
          <div className="grid rounded-lg border border-slate-200 bg-white p-1.5 sm:grid-cols-2">

            {/* ------------------------------------------------- */}
            {/* CHOOSE A PLAN                                      */}
            {/* ------------------------------------------------- */}

            <button
              type="button"
              onClick={() => setView("plans")}
              className={`group relative rounded-lg px-5 py-4 text-left transition-all ${
                view === "plans"
                  ? "bg-white shadow-sm ring-1 ring-slate-200"
                  : "hover:bg-white/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-lg transition ${
                    view === "plans"
                      ? "bg-violet-100 text-violet-600"
                      : "bg-white text-slate-400"
                  }`}
                >
                  <Sparkles className="size-4" />
                </span>

                <div>
                  <p className="text-sm font-bold text-slate-950">
                    Choose a plan
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Pick the credit package that fits
                    your needs
                  </p>
                </div>

                {view === "plans" && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-lg bg-violet-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
            </button>

            {/* ------------------------------------------------- */}
            {/* ADD MORE CREDITS                                   */}
            {/* ------------------------------------------------- */}

            <button
              type="button"
              onClick={() =>
                setView("credits")
              }
              className={`group relative rounded-lg px-5 py-4 text-left transition-all ${
                view === "credits"
                  ? "bg-white shadow-sm ring-1 ring-slate-200"
                  : "hover:bg-white/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-lg transition ${
                    view === "credits"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-white text-slate-400"
                  }`}
                >
                  <Plus className="size-4" />
                </span>

                <div>
                  <p className="text-sm font-bold text-slate-950">
                    Add more credits
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Top up your balance whenever you
                    need more
                  </p>
                </div>

                {view === "credits" && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* CHOOSE A PLAN                                         */}
        {/* ===================================================== */}

        {view === "plans" && (
          <section className="mx-auto mt-8 max-w-6xl">

            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mt-1 text-sm text-slate-500">
                  Start with the amount that works best
                  for your workspace.
                </p>
              </div>

              <span className="text-xs font-medium text-slate-400">
                One-time purchase
              </span>
            </div>

            <div className="grid items-stretch gap-5 md:grid-cols-3">
              {CREDIT_PACKS.map((pack) => {
                const featured = Boolean(
                  pack.featured,
                );

                return (
                  <article
                    key={pack.key}
                    className={`group relative flex min-h-107.5 flex-col overflow-hidden rounded-lg border transition-all duration-300 ${
                      featured
                        ? "border-violet-300 bg-white shadow-[0_20px_60px_rgba(124,58,237,0.14)] md:-translate-y-2"
                        : "border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                    }`}
                  >
                    {featured && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-fuchsia-500 to-blue-500" />
                    )}

                    {featured && (
                      <div className="absolute right-5 top-5 rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-violet-700">
                        Most popular
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        {pack.name}
                      </p>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tighter text-slate-950">
                          {formatCredits(
                            pack.credits,
                          )}
                        </span>

                        <span className="text-sm text-slate-400">
                          credits
                        </span>
                      </div>

                      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                        {pack.description}
                      </p>

                      <div className="my-6 h-px bg-slate-100" />

                      <ul className="space-y-3">
                        {[
                          "AI creation credits",
                          "Use across your Justdy workspace",
                          "Secure card checkout",
                          "Credits added after payment",
                        ].map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"
                          >
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <Check className="size-2.5 stroke-3" />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-7">
                        <button
                          type="button"
                          onClick={() =>
                            void purchaseCredits(
                              pack.key,
                            )
                          }
                          disabled={
                            purchasing !== null
                          }
                          className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            featured
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                              : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <CreditCard className="size-4" />

                          {purchasing ===
                          pack.key
                            ? "Opening secure checkout..."
                            : `Choose ${formatUsd(
                                pack.priceCents,
                              )}`}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================== */}
        {/* ADD MORE CREDITS                                      */}
        {/* ===================================================== */}

        {view === "credits" && (
          <section className="mx-auto mt-8 max-w-5xl">

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-7">

              {/* Section heading */}
              <div className="mb-7">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Plus className="size-4" />
                  </span>

                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    Add more credits
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Choose the amount of credits you&apos;d
                  like to add to your Justdy balance.
                </p>
              </div>

              {/* ------------------------------------------------ */}
              {/* CREDIT OPTIONS                                   */}
              {/* ------------------------------------------------ */}

              <div className="space-y-3">
                {CREDIT_PACKS
                  .slice()
                  .sort(
                    (a, b) =>
                      b.credits - a.credits,
                  )
                  .map((pack) => {
                    const selected =
                      selectedPack ===
                      pack.key;

                    return (
                      <button
                        key={pack.key}
                        type="button"
                        onClick={() =>
                          setSelectedPack(
                            pack.key,
                          )
                        }
                        aria-pressed={selected}
                        className={`group relative w-full rounded-lg border p-4 text-left transition-all duration-200 sm:p-5 ${
                          selected
                            ? "border-violet-500 bg-violet-50/60 shadow-[0_0_0_1px_rgba(139,92,246,0.18)]"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >

                        {/* Most popular badge */}
                        {pack.featured && (
                          <span
                            className={`absolute -right-1 -top-2 rounded-lg px-3 py-1 text-[9px] font-bold uppercase tracking-[0.08em] shadow-sm ${
                              selected
                                ? "bg-violet-600 text-white"
                                : "bg-slate-800 text-white"
                            }`}
                          >
                            Most popular
                          </span>
                        )}

                        <div className="flex items-center justify-between gap-4">

                          {/* Left side */}
                          <div className="flex min-w-0 items-center gap-4">

                            {/* Radio */}
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                                selected
                                  ? "border-violet-600 bg-violet-600"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <span className="size-2 rounded-lg bg-white" />
                              )}
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                                  {formatCredits(
                                    pack.credits,
                                  )}{" "}
                                  credits
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatUsd(
                                  pack.priceCents,
                                )}{" "}
                                total
                              </p>
                            </div>
                          </div>

                          {/* Right side */}
                          <div className="shrink-0 text-right">
                            <p className="text-base font-semibold text-slate-900 sm:text-lg">
                              {formatPricePerCredit(
                                pack.priceCents,
                                pack.credits,
                              )}

                              <span className="text-xs font-medium text-slate-400">
                                /credit
                              </span>
                            </p>

                            {pack.description && (
                              <p className="mt-1 hidden max-w-[180px] text-[10px] leading-4 text-slate-400 sm:block">
                                {pack.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* ------------------------------------------------ */}
              {/* SELECTED PACK SUMMARY                             */}
              {/* ------------------------------------------------ */}

              {selectedCreditPack && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Selected
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {formatCredits(
                          selectedCreditPack.credits,
                        )}{" "}
                        credits
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold tracking-tight text-slate-950">
                        {formatUsd(
                          selectedCreditPack.priceCents,
                        )}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        one-time purchase
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* PAYMENT BUTTON                                   */}
              {/* ------------------------------------------------ */}

              <button
                type="button"
                disabled={
                  !selectedPack ||
                  purchasing !== null
                }
                onClick={() => {
                  if (selectedPack) {
                    void purchaseCredits(
                      selectedPack,
                    );
                  }
                }}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,0.22)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CreditCard className="size-4" />

                {purchasing
                  ? "Opening secure checkout..."
                  : "Go to payment"}

                {!purchasing && (
                  <ArrowRight className="size-4" />
                )}
              </button>

              {/* ------------------------------------------------ */}
              {/* CREDIT POLICY                                    */}
              {/* ------------------------------------------------ */}

              <p className="mt-4 text-center text-xs text-slate-400">
                These credits are a one-time purchase
                and don&apos;t renew.
              </p>
            </div>

            {/* Current balance */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Zap className="size-3.5 text-violet-500" />

              {loading
                ? "Checking your balance..."
                : `${formatCredits(
                    balance ?? 0,
                  )} credits currently available`}
            </div>
          </section>
        )}

        {/* ===================================================== */}
        {/* FOOTER                                                 */}
        {/* ===================================================== */}

        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex size-5 items-center justify-center rounded-lg bg-emerald-50">
              <Check className="size-3 text-emerald-600" />
            </span>

            Secure checkout · Credits are added after
            payment confirmation
          </div>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-950"
          >
            Return to AI workspace

            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ======================================================= */}
      {/* CHECKOUT                                                */}
      {/* ======================================================= */}

      <JustdyCheckout
        open={checkoutOpen}
        clientSecret={checkoutClientSecret}
        amountCents={checkoutAmount}
        customerEmail={checkoutEmail}
        title="Justdy Checkout"
        description="Purchase credits securely with your card."
        onClose={closeCheckout}
        onSuccess={() => {
          closeCheckout();
          void loadBalance(true);
        }}
      />
    </main>
  );
}