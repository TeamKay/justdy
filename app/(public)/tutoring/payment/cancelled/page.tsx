import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TutoringPaymentCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          !
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
          Justdy Tutoring
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Payment not completed
        </h1>

        <p className="mt-4 leading-7 text-gray-600">
          Your checkout was cancelled or left incomplete. No successful payment
          is confirmed by this page.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          You can return to the payment link in your email to try again. If you
          believe you were charged, please contact Justdy before attempting
          another payment.
        </div>

        <Link
          href="/"
          className="mt-7 inline-flex rounded-lg bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900"
        >
          Return to Justdy
        </Link>
      </section>
    </main>
  );
}
