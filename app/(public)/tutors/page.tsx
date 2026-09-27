import { Suspense } from "react";

import BookingPageClient from "./BookingPageClient";

function BookingPageLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />

          <div className="mt-6 h-10 w-72 animate-pulse rounded bg-muted" />

          <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[30rem] animate-pulse rounded-sm border border-border bg-card"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function TutoringBookPage() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingPageClient />
    </Suspense>
  );
}
