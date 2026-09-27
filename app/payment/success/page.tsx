import { Suspense } from "react";
import PaymentSuccessfulClient from "./PaymentSuccessfulClient";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Confirming your payment...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessfulClient />
    </Suspense>
  );
}

