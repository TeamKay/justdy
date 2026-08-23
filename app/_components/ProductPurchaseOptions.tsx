"use client";

import { Check, Download, FileText, Printer, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { EnrollmentButton } from "./EnrollmentButton";

interface ProductPurchaseOptionsProps {
  productId: string;
  title: string;
  digitalPrice: number;
  printedPrice?: number | null;
  image?: string;
  isCourse?: boolean;
  isEnrolled?: boolean;
  enrolledHref?: string;
}

type PurchaseType = "digital" | "printed";

export function ProductPurchaseOptions({
  productId,
  title,
  digitalPrice,
  printedPrice,
  image,
  isCourse = false,
  isEnrolled = false,
  enrolledHref,
}: ProductPurchaseOptionsProps) {
  const hasPrintedOption =
    !isCourse &&
    typeof printedPrice === "number" &&
    Number.isFinite(printedPrice) &&
    printedPrice > 0;

  const [selectedOption, setSelectedOption] = useState<PurchaseType>("digital");

  /*
   * If there is no printed option, force digital.
   */

  const selectedOptionSafe: PurchaseType = hasPrintedOption
    ? selectedOption
    : "digital";

  const isPrinted = selectedOptionSafe === "printed";

  /*
   * ============================================================
   * PRICE
   * ============================================================
   */

  const selectedPrice =
    isPrinted && hasPrintedOption ? printedPrice! : digitalPrice;

  /*
   * ============================================================
   * CART PRODUCT
   * ============================================================
   */

  const cartProduct = {
    id: productId,

    title: isCourse
      ? title
      : isPrinted
        ? `${title} — Printed Hard Copy`
        : `${title} — Digital Download`,

    price: selectedPrice,

    image,

    purchaseType: isCourse
      ? ("course" as const)
      : isPrinted
        ? ("printed" as const)
        : ("digital" as const),
  };

  return (
    <aside className="lg:sticky lg:top-6">
      <div
        className="
          overflow-hidden
          rounded-md
          border
          bg-white
          shadow-xl
          shadow-slate-200/40
          border-emerald-900/30
         
          dark:shadow-none
        "
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div
          className="
            border-b
            border-emerald-900/30
            bg-linear-to-br
            from-white
            via-white
            to-slate-50
            px-6
            py-6
           
            dark:bg-emerald-900/30
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider ">
                {isCourse ? "Course enrollment" : "Get this resource"}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
              {isPrinted ? (
                <Printer className="size-5" />
              ) : isCourse ? (
                <FileText className="size-5" />
              ) : (
                <Download className="size-5" />
              )}
            </div>
          </div>

          {/* PRICE */}

          <div className="mt-0 pt-0">
            <p className="text-4xl font-bold tracking-tight text-blue-600">
              {formatPrice(selectedPrice)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {isCourse
                ? "One-time payment • Lifetime course access"
                : isPrinted
                  ? "Printed hard copy • Shipped to your address"
                  : "Digital download • Instant access after purchase"}
            </p>
          </div>
        </div>

        {/* ======================================================
            PURCHASE OPTIONS
        ====================================================== */}

        <div className="p-6">
          {isCourse ? (
            <div
              className="
                rounded-xl
                border-2
                bg-[#857938]/5
                p-4
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    size-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    bg-blue-500
                  "
                >
                  <Check className="size-3 text-white" />
                </div>

                <div
                  className="
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-emerald-500/10
                    text-emerald-600
                  "
                >
                  <FileText className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Course Enrollment</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Full course access after purchase
                  </p>
                </div>

                <p className="shrink-0 text-base font-bold">
                  {formatPrice(digitalPrice)}
                </p>
              </div>
            </div>
          ) : hasPrintedOption ? (
            /*
             * ====================================================
             * DIGITAL + PRINTED
             * ====================================================
             */

            <div className="space-y-4">
              <div>
                <h3 className="text-xs text-muted-foreground">
                  Select how you would like to receive this product.
                </h3>
              </div>

              {/* DIGITAL */}

              <button
                type="button"
                aria-pressed={selectedOptionSafe === "digital"}
                onClick={() => setSelectedOption("digital")}
                className={`
                  group
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-md
                  border-2
                  p-4
                  text-left
                  transition-all
                  duration-200
                  ${
                    selectedOptionSafe === "digital"
                      ? "border-blue-500 bg-[#857938]/5 shadow-sm"
                      : "border-slate-200 bg-background hover:border-[#857938]/50 dark:border-slate-700"
                  }
                `}
              >
                <PurchaseRadio selected={selectedOptionSafe === "digital"} />

                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Download className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Digital Download</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Download immediately
                  </p>
                </div>

                <p className="shrink-0 text-base font-bold text-blue-600">
                  {formatPrice(digitalPrice)}
                </p>
              </button>

              {/* PRINTED */}

              <button
                type="button"
                aria-pressed={selectedOptionSafe === "printed"}
                onClick={() => setSelectedOption("printed")}
                className={`
                  group
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-md
                  border-2
                  p-4
                  text-left
                  transition-all
                  duration-200
                  ${
                    selectedOptionSafe === "printed"
                      ? "border-blue-500 bg-[#857938]/5 shadow-sm"
                      : "border-slate-200 bg-background hover:border-[#857938]/50 dark:border-slate-700"
                  }
                `}
              >
                <PurchaseRadio selected={selectedOptionSafe === "printed"} />

                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Printer className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Printed Hard Copy</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Physical copy shipped to you
                  </p>
                </div>

                <p className="shrink-0 text-base font-bold text-blue-500">
                  {formatPrice(printedPrice!)}
                </p>
              </button>
            </div>
          ) : (
            /*
             * ====================================================
             * DIGITAL ONLY
             * ====================================================
             */

            <div
              className="
                rounded-md
                border-2
              
                bg-[#857938]/5
                p-4
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Download className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Digital Download</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Instant access after purchase
                  </p>
                </div>

                <p className="shrink-0 text-base font-bold text-blue-600">
                  {formatPrice(digitalPrice)}
                </p>
              </div>
            </div>
          )}

          {/* ======================================================
              BENEFITS
          ====================================================== */}

          <div className="mt-5 space-y-3">
            <PurchaseBenefit
              icon={<Check className="size-4" />}
              title="Secure purchase"
              description="Protected payment and checkout"
            />

            <PurchaseBenefit
              icon={<Check className="size-4" />}
              title={
                isCourse
                  ? "Lifetime course access"
                  : isPrinted
                    ? "Physical delivery"
                    : "Instant access"
              }
              description={
                isCourse
                  ? "Access your course whenever you need it"
                  : isPrinted
                    ? "Shipped to your address"
                    : "Access your files immediately"
              }
            />

            <PurchaseBenefit
              icon={<Check className="size-4" />}
              title="30-day guarantee"
              description="Purchase with confidence"
            />

            {isCourse && (
              <PurchaseBenefit
                icon={<Check className="size-4" />}
                title="Certificate"
                description="Receive a certificate upon completion"
              />
            )}
          </div>

          <div className="my-6 border-t border-slate-200 dark:border-white/80" />

          {/* ======================================================
              CART BUTTON
          ====================================================== */}

          {isEnrolled && enrolledHref ? (
            <Link
              href={enrolledHref}
              className="
                flex
                h-12
                w-full
                items-center
                justify-center
                rounded-xl
                bg-blue-500
                px-4
                text-sm
                font-semibold
                text-white
                transition-colors
                hover:bg-blue-600
              "
            >
              {isCourse ? "Watch Course" : "Access Your Product"}
            </Link>
          ) : (
            <EnrollmentButton
              courseId={productId}
              buttonText="Add to Cart"
              product={cartProduct}
            />
          )}

          {/* ======================================================
              SECURITY
          ====================================================== */}

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Secure checkout</span>
            <span>•</span>
            <span>Protected payment</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ==========================================================================
   RADIO INDICATOR
============================================================================= */

function PurchaseRadio({ selected }: { selected: boolean }) {
  return (
    <div
      className={`
        flex
        size-5
        shrink-0
        items-center
        justify-center
        rounded-full
        border-2
        transition-all
        ${
          selected
            ? "border-[#857938] bg-[#857938]"
            : "border-slate-300 dark:border-slate-600"
        }
      `}
    >
      {selected && <Check className="size-3 text-white" />}
    </div>
  );
}

/* ==========================================================================
   BENEFIT
============================================================================= */

function PurchaseBenefit({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>

        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/* ==========================================================================
   PRICE FORMATTER
============================================================================= */

function formatPrice(priceInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceInCents / 100);
}
