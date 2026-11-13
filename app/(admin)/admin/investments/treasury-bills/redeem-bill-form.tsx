
"use client";

import { useActionState } from "react";
import { redeemTreasuryBill, type TreasuryBillFormState } from "./actions";

export default function RedeemBillForm({
  billId,
  currency,
}: {
  billId: string;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState<
    TreasuryBillFormState,
    FormData
  >(redeemTreasuryBill, {});

  return (
    <details className="min-w-[190px]">
      <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900">
        Record redemption
      </summary>

      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="billId" value={billId} />

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Actual proceeds ({currency})
          </label>
          <input
            name="actualProceeds"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Amount received"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Redemption date
          </label>
          <input
            name="redeemedAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-xs text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Confirm redemption"}
        </button>
      </form>
    </details>
  );
}
