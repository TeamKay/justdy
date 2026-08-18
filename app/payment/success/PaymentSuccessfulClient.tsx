"use client";

import { buttonVariants } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { useConfetti } from "@/hooks/use-confetti";
import { ArrowRight, CheckIcon, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessfulClient() {
  const { triggerConfetti } = useConfetti();

  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id");

  const [customerName, setCustomerName] = useState<string | null>(null);

  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // ============================================================
  // SUCCESS EFFECT
  // ============================================================

  useEffect(() => {
    triggerConfetti();

    // Clear cart after successful checkout
    localStorage.removeItem("cart");

    // Notify Navbar/cart components
    window.dispatchEvent(new Event("cartUpdated"));
  }, [triggerConfetti]);

  // ============================================================
  // GET CUSTOMER INFORMATION
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function getCustomerDetails() {
      if (!sessionId) {
        if (!cancelled) {
          setLoadingCustomer(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `/api/payment/success?session_id=${encodeURIComponent(sessionId)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to retrieve customer information.");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setCustomerName(data.name ?? null);
        setCustomerEmail(data.email ?? null);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to retrieve customer information:", error);
        }
      } finally {
        if (!cancelled) {
          setLoadingCustomer(false);
        }
      }
    }

    getCustomerDetails();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-lg border-slate-200 shadow-xl">
        <CardContent className="p-8 sm:p-10">
          {/* ==================================================
              SUCCESS ICON
          =================================================== */}

          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckIcon className="size-8 text-emerald-600" />
            </div>
          </div>

          {/* ==================================================
              TITLE
          =================================================== */}

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payment Successful
            </h1>

            <p className="mt-2 text-slate-500">
              {loadingCustomer
                ? "Thank you for your purchase!"
                : customerName
                  ? `Thank you, ${customerName}!`
                  : "Thank you for your purchase!"}
            </p>
          </div>

          {/* ==================================================
              EMAIL NOTICE
          =================================================== */}

          <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex gap-3">
              <Mail className="mt-0.5 size-5 shrink-0 text-blue-600" />

              <div>
                <h2 className="font-semibold text-blue-900">
                  Check your email
                </h2>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  We have sent your purchase confirmation and account
                  information to:
                </p>

                {/* CUSTOMER EMAIL */}

                {customerEmail && (
                  <p className="mt-2 break-all font-semibold text-blue-900">
                    {customerEmail}
                  </p>
                )}

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Follow the account setup instructions in that email to access
                  your purchases.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              ACTIONS
          =================================================== */}

          <div className="mt-7 space-y-3">
            {/* LOGIN */}

            <Link
              href="/?login=true"
              className={buttonVariants({
                className: "h-11 w-full bg-blue-600 hover:bg-blue-700",
              })}
            >
              Sign In to My Account
              <ArrowRight className="size-4" />
            </Link>

            {/* CONTINUE SHOPPING */}

            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                className: "h-11 w-full",
              })}
            >
              Continue Shopping
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
