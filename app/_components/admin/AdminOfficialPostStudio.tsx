"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  Megaphone,
  Send,
  Trophy,
} from "lucide-react";

import { publishOfficialSocialPost } from "@/app/actions/social-official-post";
import SocialPostContent from "@/app/_components/social/posts/SocialPostContent";
import SocialRichTextEditor from "@/app/_components/social/posts/SocialRichTextEditor";

type OfficialPostType = "WELCOME" | "CHALLENGE";

export default function AdminOfficialPostStudio() {
  const router = useRouter();

  const [postType, setPostType] = useState<OfficialPostType>("WELCOME");
  const [content, setContent] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [characterCount, setCharacterCount] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canPublish =
    content.trim().length > 0 &&
    characterCount > 0 &&
    characterCount <= 3000 &&
    !isPending;

  function handlePublish() {
    setError(null);
    setSuccess(null);

    if (!canPublish) {
      setError("Write your post before publishing.");
      return;
    }

    startTransition(async () => {
      const result = await publishOfficialSocialPost({
          postType,
          content,
          ...(postType === "CHALLENGE"
            ? {
                opensAt: new Date(opensAt).toISOString(),
                closesAt: new Date(closesAt).toISOString(),
                maxScore: Number(maxScore),
              }
            : {}),
        });

          if (postType === "CHALLENGE") {
      if (!opensAt || !closesAt || !maxScore) {
        setError("Set the opening date, closing date, and maximum score.");
        return;
      }

      const openingDate = new Date(opensAt);
      const closingDate = new Date(closesAt);
      const score = Number(maxScore);

      if (
        Number.isNaN(openingDate.getTime()) ||
        Number.isNaN(closingDate.getTime()) ||
        closingDate <= openingDate
      ) {
        setError("The closing date must be later than the opening date.");
        return;
      }

      if (!Number.isInteger(score) || score < 1 || score > 10000) {
        setError("Maximum score must be a whole number between 1 and 10,000.");
        return;
      }
    }

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(
        postType === "WELCOME"
          ? "Your mathematics challenge and participation schedule have been published as Justdy Official."
          : "Your mathematics challenge has been published as Justdy Official.",
      );

      setContent("");
      setCharacterCount(0);
      setEditorKey((current) => current + 1);
      setOpensAt("");
      setClosesAt("");
      setMaxScore("100");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#52745D]">
            <Megaphone className="h-4 w-4" />
            JUSTDY ADMINISTRATION
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#173B2F] sm:text-3xl">
            Official Publishing Studio
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
            Create announcements and mathematics challenges that appear in
            the Justdy community feed under the official Justdy account.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-[#DCE8DC] bg-white px-3 py-2 text-sm font-semibold text-[#315B3F]">
          <CheckCircle2 className="h-4 w-4" />
          Justdy Official
        </div>
      </div>

      <section className="rounded-2xl border border-[#E1E9E2] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-[#244333]">
            Choose your publication type
          </h2>
          <p className="mt-1 text-sm text-[#718078]">
            Select the kind of official post you want to publish.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPostType("WELCOME");
              setError(null);
              setSuccess(null);
            }}
            disabled={isPending}
            aria-pressed={postType === "WELCOME"}
            className={`rounded-xl border p-4 text-left transition ${
              postType === "WELCOME"
                ? "border-[#52745D] bg-[#F0F6F0] ring-1 ring-[#52745D]"
                : "border-[#E5EBE5] bg-white hover:border-[#AFC5B2]"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2EFE3] text-[#315B3F]">
              <Megaphone className="h-5 w-5" />
            </div>

            <div className="font-bold text-[#244333]">
              Welcome Announcement
            </div>

            <p className="mt-1 text-sm leading-5 text-[#718078]">
              Introduce Justdy, explain its purpose, and welcome members to
              the community.
            </p>

            {postType === "WELCOME" && (
              <div className="mt-3 text-xs font-bold text-[#315B3F]">
                SELECTED
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType("CHALLENGE");
              setError(null);
              setSuccess(null);
            }}
            disabled={isPending}
            aria-pressed={postType === "CHALLENGE"}
            className={`rounded-xl border p-4 text-left transition ${
              postType === "CHALLENGE"
                ? "border-[#52745D] bg-[#F0F6F0] ring-1 ring-[#52745D]"
                : "border-[#E5EBE5] bg-white hover:border-[#AFC5B2]"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2D9] text-[#9A681A]">
              <Trophy className="h-5 w-5" />
            </div>

            <div className="font-bold text-[#244333]">
              Mathematics Challenge
            </div>

            <p className="mt-1 text-sm leading-5 text-[#718078]">
              Publish a mathematics problem or challenge for members to
              discuss and solve.
            </p>

            {postType === "CHALLENGE" && (
              <div className="mt-3 text-xs font-bold text-[#315B3F]">
                SELECTED
              </div>
            )}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E1E9E2] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1EB] text-[#315B3F]">
            {postType === "WELCOME" ? (
              <Megaphone className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </div>

          <div>
            <h2 className="font-bold text-[#244333]">
              {postType === "WELCOME"
                ? "Create welcome announcement"
                : "Create mathematics challenge"}
            </h2>

            <p className="mt-1 text-sm text-[#718078]">
              Publishing as Justdy Official
            </p>
          </div>
        </div>

                {postType === "CHALLENGE" && (
          <div className="mb-6 rounded-xl border border-[#F0E0BB] bg-[#FFFAEF] p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-bold text-[#694A2D]">
                Challenge settings
              </h3>
              <p className="mt-1 text-sm text-[#896F45]">
                Set when learners can participate and how their answers will
                be scored.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#694A2D]">
                  Opening date and time
                </span>
                <input
                  type="datetime-local"
                  value={opensAt}
                  onChange={(event) => setOpensAt(event.target.value)}
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#E5D7B8] bg-white px-3 py-2.5 text-sm text-[#463824] outline-none focus:border-[#9A681A] focus:ring-2 focus:ring-[#EED9AA]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#694A2D]">
                  Closing date and time
                </span>
                <input
                  type="datetime-local"
                  value={closesAt}
                  onChange={(event) => setClosesAt(event.target.value)}
                  disabled={isPending}
                  min={opensAt || undefined}
                  className="w-full rounded-lg border border-[#E5D7B8] bg-white px-3 py-2.5 text-sm text-[#463824] outline-none focus:border-[#9A681A] focus:ring-2 focus:ring-[#EED9AA]"
                />
              </label>

              <label className="block sm:max-w-xs">
                <span className="mb-2 block text-sm font-semibold text-[#694A2D]">
                  Maximum score
                </span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  value={maxScore}
                  onChange={(event) => setMaxScore(event.target.value)}
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#E5D7B8] bg-white px-3 py-2.5 text-sm text-[#463824] outline-none focus:border-[#9A681A] focus:ring-2 focus:ring-[#EED9AA]"
                />
              </label>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#896F45]">
              Learners can join and submit answers during the challenge
              period. The maximum score is used when grading submissions.
            </p>
          </div>
        )}

        <SocialRichTextEditor
          key={editorKey}
          value={content}
          onChange={(value, count) => {
            setContent(value);
            setCharacterCount(count);
            setError(null);
            setSuccess(null);
          }}
          disabled={isPending}
          maxLength={3000}
          showPlaceholder
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#87938A]">
            Maximum 3,000 characters. Use the editor toolbar for formatting.
          </p>

          <span
            className={`text-xs font-semibold ${
              characterCount > 3000 ? "text-red-600" : "text-[#718078]"
            }`}
          >
            {characterCount.toLocaleString()} / 3,000
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF1ED] pt-5">
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DCE5DD] px-4 py-2.5 text-sm font-semibold text-[#315B3F] transition hover:bg-[#F4F7F3]"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide preview" : "Show preview"}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#24563D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#173B2F] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Publishing..." : "Publish official post"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-[#D5E8D7] bg-[#F0F7F0] p-3 text-sm text-[#315B3F]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}
      </section>

      {showPreview && (
        <section className="space-y-3">
          <div>
            <h2 className="font-bold text-[#244333]">Feed preview</h2>
            <p className="mt-1 text-sm text-[#718078]">
              This is an approximate preview of how your post will appear to
              members.
            </p>
          </div>

          <article className="overflow-hidden rounded-2xl border border-[#DCE8DC] bg-white shadow-sm">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E2EFE3] text-sm font-bold text-[#315B3F]">
                J
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-[#244333]">
                  Justdy Official
                </div>
                <div className="text-xs text-[#87938A]">
                  @justdy_official · Just now · Public
                </div>
              </div>

              <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#315B3F]">
                {postType === "WELCOME" ? "Welcome" : "Math challenge"}
              </span>
            </div>

            {postType === "WELCOME" && (
              <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#173B2F] via-[#24563D] to-[#52745D] p-5 text-white sm:p-7">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#D6E9D7]">
                  Welcome to Justdy
                </div>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight">
                  Learn. Share. Grow.
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#E5F0E5]">
                  A place to discover knowledge, share ideas, and grow
                  together through learning.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
                  <div>
                    <div className="font-bold">Discover</div>
                    <div className="mt-1 text-xs text-[#D6E9D7]">
                      Explore ideas
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Discuss</div>
                    <div className="mt-1 text-xs text-[#D6E9D7]">
                      Share knowledge
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Improve</div>
                    <div className="mt-1 text-xs text-[#D6E9D7]">
                      Grow together
                    </div>
                  </div>
                </div>
              </div>
            )}

            {postType === "CHALLENGE" && (
              <div className="mx-4 mb-4 rounded-xl border border-[#F0E0BB] bg-[#FFFAEF] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#91621A]">
                  <Trophy className="h-4 w-4" />
                  JUSTDY MATHEMATICS CHALLENGE
                </div>
                <p className="mt-1 text-xs text-[#896F45]">
                  Think carefully. Show your reasoning. Share your solution.
                </p>
              </div>
            )}

            <div className="px-4 pb-5">
              {content ? (
                <SocialPostContent content={content} />
              ) : (
                <p className="text-sm italic text-[#A0AAA2]">
                  Your formatted post content will appear here as you write.
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 border-t border-[#EDF1ED] px-4 py-3 text-xs font-semibold text-[#87938A]">
              <span>♡ Like</span>
              <span>Comment</span>
              <span>Share</span>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
