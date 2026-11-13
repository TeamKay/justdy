"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";

import { createSocialProfile } from "@/app/actions/social-profile";

export default function SocialProfileSetupForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createSocialProfile({ username });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/home");
      router.refresh();
    });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFFDF9] px-5 py-12 text-[#173B2F]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#FAD6AC]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#DCE9DF]/70 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#64746A] transition hover:text-[#173B2F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Justdy
        </Link>

        <div className="rounded-3xl border border-[#E8E9E2] bg-white p-7 shadow-[0_20px_70px_rgba(23,59,47,0.07)] sm:p-10">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0E9] text-[#173B2F]">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B97832]">
              Your learning community
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Create your Justdy profile
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#64746A]">
              Welcome{initialDisplayName ? `, ${initialDisplayName}` : ""}.
              Choose a username to start building your learning identity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
              >
                Your username
              </label>

              <div className="flex items-center rounded-xl border border-[#DDE3DC] bg-[#FCFDFB] px-4 transition focus-within:border-[#173B2F] focus-within:ring-2 focus-within:ring-[#173B2F]/10">
                <span className="mr-1 text-[#89958C]">@</span>

                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="your_username"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#A5AEA7]"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-[#87938A]">
                3–24 characters. Use letters, numbers, and underscores.
                Your username will be lowercase.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="rounded-xl bg-[#F7F8F4] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#52745D]" />

                <div>
                  <p className="text-sm font-medium text-[#173B2F]">
                    Your profile starts private
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#718075]">
                    Your profile will be private by default. We will introduce
                    additional privacy and safety settings before enabling
                    broader social interactions.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || username.trim().length < 3}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#173B2F] px-5 text-sm font-semibold text-white transition hover:bg-[#24513F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Creating your profile..." : "Create my profile"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-[#929B93]">
            Your Justdy learning account remains the same. This simply adds
            your social learning identity.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#929B93]">
          Learn · Share · Solve · Grow
        </p>
      </div>
    </main>
  );
}