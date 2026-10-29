import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TutoringPaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
          Justdy Tutoring
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Thank you for your payment
        </h1>

        <p className="mt-4 leading-7 text-gray-600">
          Your payment has been submitted successfully. Stripe is confirming the
          transaction, and your tutoring request will be updated once payment
          verification is complete.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm leading-6 text-gray-600">
          <p className="font-semibold text-gray-900">What happens next?</p>
          <p className="mt-2">
            Justdy will verify your payment and follow up about arranging your
            tutoring session. Your session is not yet scheduled by this payment
            confirmation page.
          </p>
        </div>

        <Link
          href="/"
          className="mt-7 inline-flex rounded-lg bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900"
        >
          Return to Justdy
        </Link>

        <p className="mt-5 text-xs text-gray-500">
          Questions? Contact Justdy through the usual support channel.
        </p>
      </section>
    </main>
  );
}
