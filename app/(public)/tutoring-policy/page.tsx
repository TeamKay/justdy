import Link from "next/link";

export default function TutoringPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-14 text-foreground">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Justdy tutoring</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tutoring booking and cancellation policy</h1>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">Booking and payment</h2>
            <p className="mt-2">
              A tutoring time is temporarily reserved while checkout is in progress. A booking becomes confirmed only after Stripe confirms the payment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Cancellation</h2>
            <p className="mt-2">
              You may cancel a future booking from your tutoring sessions page. Cancelling a paid booking does not automatically issue a refund. Refund requests are reviewed and processed by Justdy support using the original Stripe payment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Rescheduling</h2>
            <p className="mt-2">
              A paid future booking may be moved to another available time with the same tutor and service, subject to availability. Rescheduling does not create a second charge.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">No-shows and technical issues</h2>
            <p className="mt-2">
              Attendance and session status are recorded by Justdy. Refunds or other remedies for tutor no-shows, learner no-shows, or material technical failures are handled by Justdy support based on the circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Questions</h2>
            <p className="mt-2">
              If you need a refund or encounter a problem with a paid lesson, contact Justdy support with your booking reference.
            </p>
          </section>
        </div>

        <Link href="/tutoring" className="mt-9 inline-flex text-sm font-medium underline underline-offset-4">
          Back to tutoring
        </Link>
      </article>
    </main>
  );
}
