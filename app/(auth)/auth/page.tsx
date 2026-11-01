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

const dottedBackground = {
  backgroundColor: "#FAD6AC",
  backgroundImage:
    "radial-gradient(circle, rgba(190,132,70,0.30) 1.1px, transparent 1.2px)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0",
};

function AuthContent() {
  const searchParams = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <main className="min-h-screen text-[#173B2F]">
      <div className="grid min-h-screen lg:grid-cols-2 ">
        {/* =========================================================
            LEFT — BRAND PANEL
        ========================================================== */}

        <section
          className="relative hidden overflow-hidden lg:flex"
          style={dottedBackground}
        >
          {/* Soft peach decorative glow */}
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#FAD6AC]/35 blur-[120px]" />

          <div className="absolute -right-40 top-[20%] h-[550px] w-[550px] rounded-full bg-[#F8D2A6]/30 blur-[130px]" />

          <div className="absolute bottom-[-250px] left-[15%] h-[500px] w-[500px] rounded-full bg-[#E8C49A]/25 blur-[120px]" />

          {/* Decorative math symbols */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="absolute left-[8%] top-[22%] -rotate-12 font-serif text-5xl text-[#B97832]/20 sm:text-7xl">
              ∑
            </span>

            <span className="absolute right-[12%] top-[25%] rotate-[9deg] font-serif text-4xl text-[#B97832]/25 sm:text-6xl">
              π
            </span>

            <span className="absolute left-[28%] top-[12%] rotate-12 font-serif text-4xl text-[#9A642F]/20 sm:text-6xl">
              ∫
            </span>

            <span className="absolute right-[30%] top-[16%] -rotate-6 font-serif text-4xl text-[#B97832]/20 sm:text-5xl">
              √
            </span>

            <span className="absolute left-[45%] bottom-[15%] rotate-12 font-serif text-5xl text-[#B97832]/20 sm:text-6xl">
              ∞
            </span>

            <span className="absolute right-[22%] bottom-[12%] -rotate-12 font-serif text-4xl text-[#9A642F]/25 sm:text-5xl">
              Δ
            </span>

            <span className="absolute left-[5%] top-[65%] rotate-6 font-serif text-4xl text-[#B97832]/20 sm:text-5xl">
              θ
            </span>

            <span className="absolute bottom-[20%] left-[15%] font-mono text-sm text-[#9A642F]/30 sm:text-base">
              x² + y² = z²
            </span>

            <span className="absolute bottom-[26%] right-[9%] font-mono text-sm text-[#9A642F]/35 sm:text-base">
              f(x) = mx + b
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/80 ring-1 ring-[#173B2F]/10">
                <Image
                  src={LogoImg}
                  alt="Justdy"
                  width={40}
                  height={40}
                  priority
                />
              </div>

              <span className="text-lg font-semibold tracking-tight text-[#173B2F]">
                Justdy
              </span>
            </Link>

            {/* Main message */}
            <div className="max-w-xl pb-10">
              <div className="mb-5 inline-flex items-center rounded-md border border-[#B97832]/20 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#9A642F] backdrop-blur">
                Live Math Tutoring
              </div>

              <h1 className="max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-[#173B2F] xl:text-6xl">
                Build confidence
                <br />
                <span className="text-[#B97832]">
                  through expert guidance.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-[#52645A] xl:text-[15px]">
                Get live, personalized help from a tutor and work through
                difficult math problems in a supportive learning environment.
              </p>

              {/* Small visual */}
              <div className="mt-10 flex items-center gap-3">
                <div className="h-px w-12 bg-[#B97832]/60" />

                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B7965]">
                  Learn · Solve · Grow
                </span>

                <div className="h-px w-12 bg-[#B97832]/60" />
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between text-xs text-[#8B7965]">
              <span>© {new Date().getFullYear()} Justdy</span>
              <span>Learn with confidence.</span>
            </div>
          </div>
        </section>

        {/* =========================================================
            RIGHT — AUTH PANEL
        ========================================================== */}

        <section
          className="relative flex min-h-screen flex-col bg-white"
        
        >
          {/* Top navigation */}
          <div className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#52645A] transition-colors hover:text-[#173B2F]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>

            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-[#173B2F] lg:hidden"
            >
              Justdy
            </Link>
          </div>

          {/* Form area */}
          <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
            <div className="w-full max-w-115">
              {/* AUTH FORM */}
              {mode === "signin" ? (
                <SigninPage onSwitchToSignup={() => setMode("signup")} />
              ) : (
                <SignupPage onSwitchToSignin={() => setMode("signin")} />
              )}

              {/* Security */}
              <p className="mt-8 text-center text-[10px] leading-5 text-[#8B7965]">
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
        <main
          className="flex min-h-screen items-center justify-center text-[#173B2F]"
          style={dottedBackground}
        >
          <div className="text-sm text-[#52645A]">Loading...</div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}