"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

type ParentWelcomePopupProps = {
  /** Set to false on pages where the notice should not appear. */
  enabled?: boolean;
};

export default function ParentWelcomePopup({
  enabled = true,
}: ParentWelcomePopupProps) {
  // Opens on every homepage load and refresh; closes only when the visitor
  // dismisses it or follows the main call to action.
  const [isOpen, setIsOpen] = useState(true);

  const closePopup = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // The handler only changes local state and is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!enabled || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePopup();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="justdy-parent-notice-title"
        className="relative grid w-full max-w-3xl overflow-hidden rounded-sm bg-white shadow-2xl md:grid-cols-[0.82fr_1.18fr]"
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close parent notice"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-transparent text-[#142F57] transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#2864F0]"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Compact left panel, inspired by the cart summary in the reference. */}
        <div className="flex flex-col justify-between bg-white px-6 py-7 sm:px-8 sm:py-9">
          <div>
            <Link
              href="/"
              onClick={closePopup}
              className="inline-flex text-2xl font-black tracking-tight text-[#142F57]"
            >
              justdy<span className="text-[#65A4FF]">.</span>
            </Link>

            <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-[#2864F0]">
              Personalized learning
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-tight text-[#142F57]">
              Give your child the right support.
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#60738F]">
              One-to-one online tutoring to help learners make progress with
              confidence.
            </p>
          </div>

          <ul className="mt-7 space-y-3 border-t border-[#DCE5F0] pt-5 text-sm font-semibold text-[#34445E]">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#2864F0]" aria-hidden="true" />
              Support tailored to your child
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#2864F0]" aria-hidden="true" />
              Learn live with a tutor
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#2864F0]" aria-hidden="true" />
              Build skills and confidence
            </li>
          </ul>
        </div>

        {/* Bold promotional panel, with a short message and one clear action. */}
        <div className="flex min-h-[330px] flex-col items-center justify-center bg-[#FFE88A] px-6 py-12 text-center sm:px-9 md:min-h-[420px]">
          <p className="text-base font-bold text-[#E84A32] sm:text-lg">
            A brighter learning journey starts here
          </p>

          <h2
            id="justdy-parent-notice-title"
            className="mt-5 max-w-md text-4xl font-black uppercase leading-[0.98] tracking-tight text-black sm:text-5xl md:text-6xl"
          >
            Help them
            <br />
            thrive.
          </h2>

          <p className="mt-5 max-w-sm text-sm leading-6 text-[#493F20] sm:text-base">
            Find tutoring that fits your child&apos;s learning needs.
          </p>

          <Link
            href="/tutoring"
            onClick={closePopup}
            className="mt-7 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-[#142F57] focus:outline-none focus:ring-4 focus:ring-black/20"
          >
            Explore tutoring <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <p className="mt-4 text-xs text-[#655A31]">
            Personalized support. Real progress.
          </p>
        </div>
      </section>
    </div>
  );
}
