import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Mail, ArrowLeft } from "lucide-react";

import LogoImg from "@/public/images/logo.png";

interface VerifyRequestPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function VerifyRequestPage({
  searchParams,
}: VerifyRequestPageProps) {
  const params = await searchParams;

  const email =
    params.email?.trim() || "";

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src={LogoImg}
              alt="Justdy"
              width={150}
              height={50}
              priority
            />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            {/* Success icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Account Created!
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your Justdy account has been created
              successfully.
            </p>

            {/* Email box */}
            <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" />

                <span>
                  Verification email sent
                </span>
              </div>

              {email ? (
                <p className="mt-2 break-all text-sm font-medium text-primary">
                  {email}
                </p>
              ) : null}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-left">
              <h2 className="text-sm font-semibold text-foreground">
                What to do next
              </h2>

              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    1
                  </span>

                  <span>
                    Open your email inbox.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    2
                  </span>

                  <span>
                    Find the email from Justdy titled
                    <strong className="font-semibold text-foreground">
                      {" "}
                      &quot;Verify Your Justdy Account&quot;
                    </strong>
                    .
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    3
                  </span>

                  <span>
                    Click the verification link in
                    the email.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    4
                  </span>

                  <span>
                    After verification, return to
                    Justdy and sign in.
                  </span>
                </li>
              </ol>
            </div>

            {/* Spam notice */}
            <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-left text-xs leading-5 text-amber-800">
              <strong>Didn&apos;t receive the email?</strong>{" "}
              Check your spam or junk folder. Make sure
              you entered the correct email address.
            </div>

            {/* Sign in */}
            <Link
              href="/auth?mode=signin"
              className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Continue to Sign In
            </Link>

            {/* Back */}
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Justdy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}