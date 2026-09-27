"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Printer,
} from "lucide-react";

interface ColoringPage {
  index: number;
  url: string;
  mimeType?: string | null;
}

interface ColoringPageLearnerProps {
  resourceId: string;
  slug: string;
  title: string;
  description?: string | null;
  pages: ColoringPage[];
}

export default function ColoringPageLearner({
  title,
  slug,
  description,
  pages,
}: ColoringPageLearnerProps) {
  const orderedPages = useMemo(
    () =>
      pages
        .slice()
        .sort((a, b) => a.index - b.index),
    [pages],
  );

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const currentPage =
    orderedPages[currentIndex];

  if (!currentPage) {
    return null;
  }

  const hasPrevious = currentIndex > 0;
  const hasNext =
    currentIndex < orderedPages.length - 1;

  function previousPage() {
    if (hasPrevious) {
      setCurrentIndex((index) => index - 1);
    }
  }

  function nextPage() {
    if (hasNext) {
      setCurrentIndex((index) => index + 1);
    }
  }

  function printPage() {
    window.print();
  }

  function openFullSize() {
    window.open(
      currentPage.url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href={`/resources/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to resource
          </Link>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={openFullSize}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Maximize2 className="h-4 w-4" />
              Full size
            </button>

            <a
              href={currentPage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Open / save
            </a>

            <button
              type="button"
              onClick={printPage}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 print:hidden">
            Coloring Page
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>

          {description ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 print:hidden">
            <button
              type="button"
              onClick={previousPage}
              disabled={!hasPrevious}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                Page {currentIndex + 1} of{" "}
                {orderedPages.length}
              </p>
              <p className="text-xs text-slate-500">
                Printable coloring page
              </p>
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={!hasNext}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-slate-100 p-3 sm:p-6 lg:p-8">
            <div className="print-target mx-auto w-full max-w-3xl bg-white shadow-sm print:max-w-none print:shadow-none">
              <img
                src={currentPage.url}
                alt={`${title} — page ${
                  currentIndex + 1
                }`}
                className="block h-auto w-full"
              />
            </div>
          </div>

          {orderedPages.length > 1 ? (
            <div className="flex flex-wrap justify-center gap-2 border-t border-slate-100 px-4 py-4 print:hidden">
              {orderedPages.map(
                (page, index) => (
                  <button
                    key={`${page.index}-${page.url}`}
                    type="button"
                    onClick={() =>
                      setCurrentIndex(index)
                    }
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                      index === currentIndex
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    aria-label={`View page ${
                      index + 1
                    }`}
                    aria-current={
                      index === currentIndex
                        ? "page"
                        : undefined
                    }
                  >
                    {index + 1}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </section>

        <p className="mt-5 text-center text-xs text-slate-500 print:hidden">
          Use Print for a clean printable copy. Full size opens the original
          image in a new tab.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-target,
          .print-target * {
            visibility: visible !important;
          }

          .print-target {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }

          .print-target img {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: 100vh !important;
            object-fit: contain !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </main>
  );
}
