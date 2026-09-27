"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import LogoImg from "@/public/images/logo.png";

import { SigninPage } from "../../_components/Signin";
import { SignupPage } from "@/app/_components/Signup";



type AuthMode = "signin" | "signup";

function AuthContent() {
  const searchParams = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "signup"
      ? "signup"
      : "signin";

  const [mode, setMode] =
    useState<AuthMode>(initialMode);

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =========================================================
            LEFT — BRAND PANEL
        ========================================================== */}

        <section className="relative hidden overflow-hidden lg:flex">
          {/* Background */}
          <div className="absolute inset-0 bg-emerald-950" />

          {/* Large purple/blue glow */}
          <div className="absolute -left-32 -top-32 h-[700px] w-[700px] rounded-full bg-[#4338CA]/35 blur-[140px]" />

          <div className="absolute right-[-180px] top-[15%] h-[650px] w-[650px] rounded-full bg-[#7C3AED]/25 blur-[150px]" />

          <div className="absolute bottom-[-250px] left-[10%] h-[600px] w-[600px] rounded-full bg-[#2563EB]/20 blur-[150px]" />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-14">

            {/* Logo */}
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
                <Image
                  src={LogoImg}
                  alt="Justdy"
                  width={40}
                  height={40}
                  priority
                />
              </div>

              <span className="text-lg font-semibold tracking-tight">
                Justdy
              </span>
            </Link>

            {/* Main message */}
            <div className="max-w-xl pb-10">

              <div className="mb-5 inline-flex items-center rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                Live Math Tutoring
              </div>

              <h1 className="max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white xl:text-6xl">
                Build confidence
                <br />
                <span className="text-[#A78BFA]">
                  through Experts
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/60 xl:text-[15px]">
                Get live, personalized help from a tutor and work
                through difficult problems in real time.
              </p>

              {/* Small visual */}
              <div className="mt-10 flex items-center gap-3">
                <div className="h-px w-12 bg-[#A78BFA]/60" />

                <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                  Learn · Solve · Grow
                </span>

                <div className="h-px w-12 bg-[#A78BFA]/60" />
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between text-xs text-white/35">
              <span>
                © {new Date().getFullYear()} Justdy
              </span>

              <span>
                Learn with confidence.
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================
            RIGHT — AUTH PANEL
        ========================================================== */}

        <section className="flex min-h-screen flex-col bg-background">

          {/* Top navigation */}
          <div className="flex items-center justify-between px-6 py-6 sm:px-10">

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>

            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-white lg:hidden"
            >
              Justdy
            </Link>

          </div>

          {/* Form area */}
          <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
            <div className="w-full max-w-115">

              {/* =====================================================
                  AUTH FORM
              ====================================================== */}

              {mode === "signin" ? (
                <SigninPage
                  onSwitchToSignup={() =>
                    setMode("signup")
                  }
                />
              ) : (
                <SignupPage
                  onSwitchToSignin={() =>
                    setMode("signin")
                  }
                />
              )}

              {/* Security */}
              <p className="mt-8 text-center text-[10px] leading-5 text-white/25">
                Your information is securely encrypted and protected.
              </p>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
          <div className="text-sm text-white/50">
            Loading...
          </div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}