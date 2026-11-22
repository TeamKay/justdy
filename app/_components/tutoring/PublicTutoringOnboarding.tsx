
"use client";

import { useEffect, useState, type ReactNode, Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import TutoringOnboarding from "@/app/_components/tutoring/TutoringOnboarding";
import { SigninPage } from "@/app/_components/Signin";
import { SignupPage } from "@/app/_components/Signup";

type PublicView = "intro" | "tutoring" | "signin" | "signup";

export default function PublicTutoringOnboarding({
  children,
}: {
  children: ReactNode;
}) {
  const [view, setView] = useState<PublicView>("intro");
  useEffect(() => {
  const openSignIn = () => setView("signin");

  window.addEventListener("justdy:open-public-signin", openSignIn);

  return () => {
    window.removeEventListener("justdy:open-public-signin", openSignIn);
  };
}, []);

  return (
    <>
      {view === "intro" && (
        <div className="mb-7 rounded-lg border border-[#DDE8DD] bg-white p-5 shadow-sm sm:p-7">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#EAF1EB] px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#315B43]">
            <span className="h-2 w-2 rounded-lg bg-[#6D9B72]" />
            Intellectual Classroom
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#173B2F] sm:text-3xl">
            Learn, share and grow together.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#718075]">
            Explore ideas, discover learning resources and connect with
            the Justdy learning community. Improve your math skills through
            expert guidance, group learning, and live response from mates.
            You can explore before creating an account.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView("tutoring")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#312c65] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#312c65]"
            >
              Schedule free pre-assessment
              <ArrowUpRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setView("signin")}
              className="inline-flex items-center rounded-lg border border-[#DCE7DC] bg-white px-5 py-3 text-xs font-semibold text-[#315B43] transition hover:bg-[#F7F9F6]"
            >
              Join Now
            </button>
          </div>
        </div>
      )}

      {view === "tutoring" && (
        <TutoringOnboarding embedded />
      )}

      {(view === "signin" || view === "signup") && (
        <div className="mb-7 overflow-hidden rounded-lg border border-[#DDE8DD] bg-white shadow-sm">
          <div className="border-b border-[#DDE8DD] px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={() => setView("intro")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#52645A] transition hover:text-[#173B2F]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to community
            </button>
          </div>

          <div className="mx-auto w-full max-w-lg px-3 py-5 sm:px-6 sm:py-7">
            <Suspense
              fallback={
                <div className="py-12 text-center text-sm text-[#718075]">
                  Loading sign-in...
                </div>
              }
            >
              {view === "signin" ? (
               <SigninPage
                  onSwitchToSignup={() => setView("signup")}
                  redirectTo="/"
                />
              ) : (
                <SignupPage
                  onSwitchToSignin={() => setView("signin")}
                />
              )}
            </Suspense>
          </div>

          <p className="px-5 pb-5 text-center text-[10px] leading-5 text-[#8B7965]">
            Your information is securely encrypted and protected.
          </p>
        </div>
      )}

      {view === "intro" && children}
    </>
  );
}
