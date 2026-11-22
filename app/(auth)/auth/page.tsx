"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogoImg from "@/public/images/logo.png";

import { SigninPage } from "@/app/_components/Signin";
import { SignupPage } from "@/app/_components/Signup";

type AuthMode = "signin" | "signup";



function AuthContent() {
  const searchParams = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2 ">
        <section className="relative isolate overflow-hidden bg-[#dce1d9]">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
                backgroundSize: "25px 25px",
              }}
            />
      

          {/* Content */}
          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-0 transition-opacity hover:opacity-80"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
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

               <h1 className="max-w-2xl font-chalkduster text-[2.75rem] font-bold leading-[1.12] tracking-tight text-[#153F38] sm:text-6xl lg:text-[3.5rem]">
               Build confidence
                <span className="relative mt-1 block text-[#E6A52C]">
                 through expert guidance.
                  <svg
                    className="absolute -bottom-3 left-1/2 w-52 -translate-x-1/2 sm:w-104 lg:left-0 lg:translate-x-0"
                    viewBox="0 0 260 17"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 12C64 2 176 2 256 10"
                      stroke="#E6A52C"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
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
        
        >
          <div className="text-sm text-[#52645A]">Loading...</div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}