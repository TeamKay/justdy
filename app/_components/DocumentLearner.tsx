"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
} from "lucide-react";

interface DocumentLearnerProps {
  slug: string;
  title: string;
  description?: string | null;
  content: string;
}

export default function DocumentLearner({
  slug,
  title,
  description,
  content,
}: DocumentLearnerProps) {
  const [printing, setPrinting] = useState(false);

  function printDocument() {
    setPrinting(true);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setPrinting(false), 500);
    }, 50);
  }

  function downloadText() {
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "document"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/resources/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to resource
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadText}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              type="button"
              onClick={printDocument}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              {printing ? "Preparing…" : "Print"}
            </button>
          </div>
        </div>

        <article className="print-document overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-100 px-6 py-8 sm:px-10 print:px-0 print:py-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 print:hidden">
              <FileText className="h-4 w-4" />
              Document
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10 print:px-0 print:py-5">
            <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
              {content}
            </div>
          </div>
        </article>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.65in;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-document,
          .print-document * {
            visibility: visible !important;
          }

          .print-document {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: 0 !important;
          }

          .print-document header {
            break-after: avoid;
            page-break-after: avoid;
          }

          .print-document .whitespace-pre-wrap {
            overflow-wrap: anywhere;
          }
        }
      `}</style>
    </main>
  );
}
