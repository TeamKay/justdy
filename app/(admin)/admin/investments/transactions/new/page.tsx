import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { createInvestmentTransaction } from "../actions";

const transactionTypes = [
  ["CONTRIBUTION", "Contribution"],
  ["DEPOSIT", "Deposit"],
  ["BUY", "Buy investment"],
  ["SELL", "Sell investment"],
  ["DIVIDEND", "Dividend"],
  ["INTEREST", "Interest"],
  ["FEE", "Fee"],
  ["WITHDRAWAL", "Withdrawal"],
  ["TRANSFER_IN", "Transfer in"],
  ["TRANSFER_OUT", "Transfer out"],
  ["MATURITY", "Treasury bill maturity"],
  ["REINVESTMENT", "Reinvestment"],
  ["ADJUSTMENT", "Adjustment"],
] as const;

export default async function NewInvestmentTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      redirect("/login");
    }

    redirect("/admin");
  }

  const params = await searchParams;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments");
  }

  const [accounts, assets] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
      orderBy: [{ provider: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        provider: true,
        currency: true,
      },
    }),
    prisma.investmentAsset.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        symbol: true,
        assetType: true,
        currency: true,
      },
    }),
  ]);

  const errorMessages: Record<string, string> = {
    invalid: "Check the transaction details and enter valid amounts and dates.",
    account: "The selected account could not be found.",
    asset: "The selected investment could not be found.",
    duplicate: "That transaction reference already exists for this account.",
    profile: "Your investment profile could not be found.",
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/investments/transactions"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to transactions
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Record investment transaction
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Record an activity in one of your accounts and optionally
          link it to a specific investment.
        </p>
      </div>

      {params.error && errorMessages[params.error] && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessages[params.error]}
        </div>
      )}

      {accounts.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">
            Create an investment account before recording a transaction.
          </p>

          <Link
            href="/admin/investments/accounts/new"
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Create account
          </Link>
        </section>
      ) : (
        <form
          action={createInvestmentTransaction}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Account" required>
              <select
                name="accountId"
                required
                className={inputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Select an account
                </option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {account.provider} (
                    {account.currency})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Investment">
              <select
                name="assetId"
                className={inputClass}
                defaultValue=""
              >
                <option value="">
                  No specific investment / cash activity
                </option>

                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                    {asset.symbol ? ` (${asset.symbol})` : ""} —{" "}
                    {asset.currency}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Transaction type" required>
              <select
                name="type"
                required
                className={inputClass}
                defaultValue="BUY"
              >
                {transactionTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Transaction date and time" required>
              <input
                type="datetime-local"
                name="occurredAt"
                required
                defaultValue={new Date().toISOString().slice(0, 16)}
                className={inputClass}
              />
            </Field>

            <Field label="Currency" required>
              <select
                name="currency"
                required
                defaultValue="USD"
                className={inputClass}
              >
                <option value="USD">USD — US dollar</option>
                <option value="GHS">GHS — Ghanaian cedi</option>
              </select>
            </Field>

            <Field label="Amount" required>
              <input
                type="number"
                name="amount"
                required
                min="0.00000001"
                step="any"
                placeholder="0.00"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter a positive amount. The transaction type determines
                how the activity is interpreted.
              </p>
            </Field>

            <Field label="Quantity / units">
              <input
                type="number"
                name="quantity"
                min="0"
                step="any"
                placeholder="e.g. 10 shares"
                className={inputClass}
              />
            </Field>

            <Field label="Price per unit">
              <input
                type="number"
                name="unitPrice"
                min="0"
                step="any"
                placeholder="0.00"
                className={inputClass}
              />
            </Field>

            <Field label="Fees">
              <input
                type="number"
                name="fees"
                min="0"
                step="any"
                defaultValue="0"
                className={inputClass}
              />
            </Field>

            <Field label="External reference / statement ID">
              <input
                type="text"
                name="externalId"
                maxLength={200}
                placeholder="Optional unique reference"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <input
              type="text"
              name="description"
              maxLength={500}
              placeholder="e.g. Purchased shares in a listed company"
              className={inputClass}
            />
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              rows={3}
              maxLength={5000}
              placeholder="Optional details about this transaction"
              className={inputClass}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              href="/admin/investments/transactions"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Save transaction
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}