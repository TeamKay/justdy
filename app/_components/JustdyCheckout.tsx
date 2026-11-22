"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadStripe,
  type Stripe,
  type StripeCheckoutElementsSdk,
  type StripeCheckoutElementsSdkOptions,
  type StripeCheckoutLoadActionsSuccess,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  clientSecret: string | null;
  amountCents: number | null;
  customerEmail: string;
  title?: string;
  description?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type StripeWithCheckoutElements = Stripe & {
  initCheckoutElementsSdk(
    options: StripeCheckoutElementsSdkOptions,
  ): StripeCheckoutElementsSdk;
};

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

export default function JustdyCheckout({
  open,
  clientSecret,
  amountCents,
  customerEmail,
  title = "Complete your payment",
  description,
  onClose,
  onSuccess,
}: Props) {
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [paying, setPaying] = useState(false);

  const checkoutActionsRef = useRef<StripeCheckoutLoadActionsSuccess | null>(
    null,
  );
  const checkoutInstanceRef = useRef<StripeCheckoutElementsSdk | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const billingAddressElementRef = useRef<ReturnType<
    StripeCheckoutElementsSdk["createBillingAddressElement"]
  > | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !paying) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, paying]);

  useEffect(() => {
    if (!open || !clientSecret || !stripePromise) return;

    const currentClientSecret = clientSecret;
    let cancelled = false;

    async function initializeCheckout() {
      setCheckoutReady(false);
      setPaying(false);
      toast.dismiss();

      try {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Secure payment is temporarily unavailable.");
        }

        const checkout = (
          stripe as StripeWithCheckoutElements
        ).initCheckoutElementsSdk({
          clientSecret: currentClientSecret,
          elementsOptions: {
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#4f46e5",
                colorBackground: "#ffffff",
                colorText: "#111827",
                colorDanger: "#dc2626",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSizeBase: "14px",
                spacingUnit: "4px",
                borderRadius: "10px",
              },
              rules: {
                ".Input": {
                  border: "1px solid #d8dee9",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                  padding: "12px",
                },
                ".Input:focus": {
                  border: "1px solid #4f46e5",
                  boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.10)",
                },
                ".Label": {
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#111827",
                },
                ".Error": {
                  fontSize: "12px",
                },
              },
            },
          },
        });

        if (cancelled) return;

        checkoutInstanceRef.current = checkout;

        const billingAddressElement = checkout.createBillingAddressElement();
        billingAddressElementRef.current = billingAddressElement;
        billingAddressElement.mount("#justdy-checkout-billing-address");

        const paymentElement = checkout.createPaymentElement({
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        });

        paymentElementRef.current = paymentElement;
        paymentElement.mount("#justdy-checkout-payment");

        const loadActionsResult = await checkout.loadActions();

        if (cancelled) return;

        if (loadActionsResult.type !== "success") {
          throw new Error(
            loadActionsResult.error?.message ||
              "Unable to initialize secure payment.",
          );
        }

        checkoutActionsRef.current = loadActionsResult.actions;
        setCheckoutReady(true);
      } catch (error) {
        if (!cancelled) {
          console.error("Justdy checkout initialization failed:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to initialize secure payment.",
          );
          setCheckoutReady(false);
        }
      }
    }

    void initializeCheckout();

    return () => {
      cancelled = true;

      try {
        billingAddressElementRef.current?.unmount?.();
      } catch {}

      try {
        paymentElementRef.current?.unmount?.();
      } catch {}

      billingAddressElementRef.current = null;
      paymentElementRef.current = null;
      checkoutActionsRef.current = null;
      checkoutInstanceRef.current = null;
      setCheckoutReady(false);
      setPaying(false);
    };
  }, [open, clientSecret]);

  async function handlePay() {
    if (paying) return;

    setPaying(true);
    toast.dismiss();

    try {
      const actions = checkoutActionsRef.current;

      if (!actions) {
        throw new Error("Secure payment is not ready yet.");
      }

      const result = await actions.confirm();

      if (result?.type === "error") {
        throw new Error(
          result.error?.message || "Payment could not be completed.",
        );
      }

      onSuccess?.();
    } catch (error) {
      console.error("Justdy checkout confirmation failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment could not be completed.",
      );
      setPaying(false);
    }
  }

  if (!open || !clientSecret) return null;

  const formattedAmount =
    amountCents == null ? "$0.00" : `$${(amountCents / 100).toFixed(2)}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-0 backdrop-blur-[6px] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="justdy-checkout-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !paying) onClose();
      }}
    >
      <div className="relative flex h-full w-full max-w-[920px] overflow-hidden rounded-none bg-white shadow-[0_30px_100px_rgba(15,23,42,0.30)] sm:h-auto sm:max-h-[94vh] sm:rounded-[22px]">
        <div className="hidden w-[38%] flex-col justify-between bg-slate-950 p-8 text-white sm:flex lg:p-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm">
                <span className="text-sm font-black tracking-tight">J</span>
              </div>
              <span className="text-sm font-bold tracking-tight">justdy</span>
            </div>

            <div className="mt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/75">
                <ShieldCheck className="size-3.5" />
                Secure checkout
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] lg:text-[38px]">
                {title}
              </h2>

              {description ? (
                <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
                  {description}
                </p>
              ) : (
                <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
                  Your payment is securely processed by Stripe and never stored
                  by Justdy.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Total due today
            </div>
            <div className="text-4xl font-semibold tracking-[-0.04em]">
              {formattedAmount}
            </div>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-white/45">
              <LockKeyhole className="size-3.5" />
              Encrypted payment connection
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto bg-white">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={paying}
                className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-950 disabled:opacity-50"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={paying}
                aria-label="Close payment dialog"
                className="flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-7 pt-6 sm:px-8 sm:pb-9">
            <div className="sm:hidden">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                  J
                </span>
                justdy checkout
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Total due today
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  {formattedAmount}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                <CreditCard className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900">
                  Card payment
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-500">
                  {customerEmail || "Secure Justdy payment"}
                </div>
              </div>
              <ShieldCheck className="ml-auto size-4 shrink-0 text-indigo-500" />
            </div>

            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-950">
                  Payment details
                </label>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Stripe secure
                </span>
              </div>
              <div
                id="justdy-checkout-payment"
                className="min-h-[190px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              />
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm font-semibold text-slate-950">
                Billing address
              </div>
              <div
                id="justdy-checkout-billing-address"
                className="min-h-[210px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              />
            </div>

            <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Amount due
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                    {formattedAmount}
                  </div>
                </div>
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
            </div>

            <button
              type="button"
              disabled={paying || !checkoutReady}
              onClick={() => void handlePay()}
              aria-busy={paying}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.22)] transition hover:bg-indigo-700 hover:shadow-[0_14px_30px_rgba(79,70,229,0.27)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
            >
              {paying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing payment…
                </>
              ) : !checkoutReady ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Preparing secure checkout…
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" />
                  Pay {formattedAmount}
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-4 text-slate-400">
              <LockKeyhole className="size-3" />
              Secure card processing by Stripe · Your card details never touch
              Justdy servers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
