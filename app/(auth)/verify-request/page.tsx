import Link from "next/link";
import Image from "next/image";
import LogoImg from "@/public/images/logo.png";
import { ArrowLeft } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(#1a1a1a 1px, transparent 1px),
            linear-gradient(90deg, #1a1a1a 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
          style={{
            width: "800px",
            height: "800px",
            filter: "blur(120px)",
            background:
              "radial-gradient(circle, #6366f1 0%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-md relative z-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]">
        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 px-8 py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src={LogoImg} alt="Logo" width={50} height={50} priority />
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Check Your Email
            </h1>

            <p className="text-zinc-400 mt-4 leading-relaxed">
              We&apos;ve sent a verification link to your email address.
            </p>

            <p className="text-zinc-500 text-sm mt-3">
              Click the link in the email to activate your account and continue
              to Justdy.
            </p>
          </div>

          {/* Tips */}
          <div className="mt-8 rounded-xl border border-white/5 bg-white/2 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
              Didn&apos;t receive it?
            </p>

            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• Check your spam or junk folder.</li>
              <li>• Verify you entered the correct email address.</li>
              <li>• Wait a few minutes for delivery.</li>
            </ul>
          </div>

          {/* Back Button */}
          <Link
            href="/login"
            className="mt-8 flex items-center justify-center gap-2 h-12 rounded-lg border border-white/10 bg-white/2 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        {/* Footer Strip */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-[0.2em]">
            Secure Verification • Justdy.com
          </p>
        </div>
      </div>
    </div>
  );
}
