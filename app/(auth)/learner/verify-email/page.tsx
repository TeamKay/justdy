import Link from "next/link";

export default function LearnerVerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-5 text-4xl" aria-hidden="true">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Email verification complete
        </h1>

        <p className="mt-4 text-slate-600">
          Your verification link has redirected you here. If you arrived by
          clicking the verification email, your email verification should now be
          complete.
        </p>

        <p className="mt-4 text-slate-600">
          To finish setting up your learner account, return to your email and
          click the separate password setup link if you have not already set
          your password.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Return to Justdy
        </Link>
      </section>
    </main>
  );
}
