"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  Paperclip,
  ShieldCheck,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function NewQuestionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function selectFile(file?: File) {
    if (!file) return;

    setError("");

    const isImage = file.type.startsWith("image/");
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setError("Please choose an image or PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Your file must be 10 MB or smaller.");
      return;
    }

    setAttachment(file);
  }

  function removeAttachment() {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!question.trim() && !attachment) {
      setError("Please type your question or attach an image or PDF.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("question", question.trim());
      formData.set("email", email.trim().toLowerCase());

      if (attachment) {
        formData.set("attachment", attachment);
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "We couldn't submit your question. Please try again.",
        );
      }

      window.location.href = `/questions/submitted?id=${encodeURIComponent(data.questionId || "")}`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fd] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-100/70 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-100/50 blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Justdy
        </Link>

        <div className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.09)] sm:mt-9">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 px-6 py-9 text-white sm:px-10 sm:py-11">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
                <Lightbulb className="h-4 w-4" />
                Every question is a new beginning
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Begin with a Question
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                Tell us what you are working on. You can type your question,
                upload a picture or PDF, or do both. A verified tutor can then
                offer guidance.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7 p-6 sm:p-10">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-blue-600" />
                <label
                  htmlFor="question"
                  className="text-sm font-extrabold text-slate-900"
                >
                  What would you like help with?
                </label>
              </div>

              <textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Type your question here. Explain what you have tried so far, or tell us which part you find difficult..."
                rows={7}
                maxLength={10000}
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                <span>You can write as much detail as you need.</span>
                <span className="tabular-nums">
                  {question.length.toLocaleString()}/10,000
                </span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-extrabold text-slate-900">
                  Add an image or PDF
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Optional
                </span>
              </div>

              {!attachment ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-5 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm transition group-hover:scale-105">
                    <ImagePlus className="h-7 w-7" />
                  </span>
                  <span className="mt-4 text-sm font-extrabold text-slate-800">
                    Choose a file to upload
                  </span>
                  <span className="mt-1.5 text-xs text-slate-500">
                    Images or PDF documents · Maximum 10 MB
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    {attachment.type.startsWith("image/") ? (
                      <ImagePlus className="h-6 w-6" />
                    ) : (
                      <FileText className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {attachment.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    aria-label="Remove attachment"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onChange={(event) => selectFile(event.target.files?.[0])}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-extrabold text-slate-900"
              >
                Your email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                We&apos;ll use this email to contact you when a verified tutor
                offers to guide you.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    Your question is shared privately
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Only verified tutors on Justdy will be able to view your
                    submitted question and its attachments.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting your question...
                </>
              ) : (
                <>
                  Submit my question
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-slate-400">
              By submitting, you agree to let verified Justdy tutors review
              your question so they can offer guidance.
            </p>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Ask. Understand. Grow.
          <span className="mx-1">·</span>
          <BookOpen className="h-4 w-4" />
          Justdy Question Help
        </div>
      </div>
    </main>
  );
}
