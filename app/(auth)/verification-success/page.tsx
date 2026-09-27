import Link from "next/link";
import Image from "next/image";
import LogoImg from "@/public/images/logo.png";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function VerificationSuccessPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src={LogoImg}
            alt="Justdy"
            width={150}
            height={50}
            priority
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2
                className="h-9 w-9 text-green-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Email Verified
          </h1>

          <p className="mt-3 text-gray-600">
            Your Justdy account has been successfully
            verified.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            You can now sign in to your account and
            continue to Justdy.
          </p>

          <Link
            href="/auth?mode=signin"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Sign In
            <ArrowRight
              className="h-4 w-4"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}