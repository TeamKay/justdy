"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  AssetType,
  CurrencyType,
  InvestmentTransactionType,
  RegionType,
  StatusType,
} from "@/lib/generated/prisma/client";

export interface CreateInvestmentInput {
  name: string;
  tickerOrSymbol?: string | null;
  cusip?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  institution?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  type: InvestmentTransactionType;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  grossAmount?: number | null;
  fees?: number;
  taxes?: number;
  costBasis?: number | null;
  realizedGain?: number | null;
  marketValue?: number | null;
  unrealizedGain?: number | null;
  unrealizedGainPercent?: number | null;
  cashBalance?: number | null;
  exchangeRate?: number;
  date?: Date;
  settlementDate?: Date | null;
  source?: string | null;
  sourceFile?: string | null;
  importBatchId?: string | null;
  fingerprint?: string | null;
  status?: StatusType;
  notes?: string | null;
}

export type BulkImportResult = {
  success: boolean;
  imported: number;
  duplicates: number;
  error?: string;
};

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized. Please log in.");
  return userId;
}

function nullableString(value?: string | null): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function nullableNumber(value?: number | null): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

function buildFingerprint(input: CreateInvestmentInput): string {
  const date = input.date
    ? new Date(input.date).toISOString().slice(0, 10)
    : "";
  return [
    date,
    (input.tickerOrSymbol || input.name || "").trim().toUpperCase(),
    input.type,
    input.accountNumber?.trim() ?? "",
    input.accountName?.trim() ?? "",
    Number(input.shares ?? 0).toFixed(8),
    Number(input.pricePerShare ?? 0).toFixed(6),
    Number(input.amount ?? 0).toFixed(2),
    Number(input.grossAmount ?? input.amount ?? 0).toFixed(2),
    Number(input.fees ?? 0).toFixed(2),
    Number(input.taxes ?? 0).toFixed(2),
    input.settlementDate
      ? new Date(input.settlementDate).toISOString().slice(0, 10)
      : "",
  ].join("|");
}

function amountUSD(
  amount: number,
  currency: CurrencyType,
  rate: number,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (currency === CurrencyType.USD) return amount;
  return Number.isFinite(rate) && rate > 0 ? amount * rate : 0;
}

function normalizeCreate(input: CreateInvestmentInput, userId: string) {
  const exchangeRate =
    Number.isFinite(input.exchangeRate) && (input.exchangeRate ?? 0) > 0
      ? input.exchangeRate!
      : 1;
  const amount = Number.isFinite(input.amount) ? Math.abs(input.amount) : 0;

  return {
    userId,
    name: input.name.trim(),
    tickerOrSymbol: nullableString(input.tickerOrSymbol),
    cusip: nullableString(input.cusip),
    accountNumber: nullableString(input.accountNumber),
    accountName: nullableString(input.accountName),
    institution: nullableString(input.institution) ?? "Fidelity Investments",
    assetClass: input.assetClass,
    region: input.region,
    currency: input.currency,
    type: input.type,
    shares: nullableNumber(input.shares),
    pricePerShare: nullableNumber(input.pricePerShare),
    amount,
    grossAmount: nullableNumber(input.grossAmount) ?? amount,
    fees: Number.isFinite(input.fees ?? 0) ? Math.abs(input.fees ?? 0) : 0,
    taxes: Number.isFinite(input.taxes ?? 0) ? Math.abs(input.taxes ?? 0) : 0,
    costBasis: nullableNumber(input.costBasis),
    realizedGain: nullableNumber(input.realizedGain),
    marketValue: nullableNumber(input.marketValue),
    unrealizedGain: nullableNumber(input.unrealizedGain),
    unrealizedGainPercent: nullableNumber(input.unrealizedGainPercent),
    cashBalance: nullableNumber(input.cashBalance),
    exchangeRate,
    amountUSD: amountUSD(amount, input.currency, exchangeRate),
    date: input.date ?? new Date(),
    settlementDate: input.settlementDate ?? null,
    source: nullableString(input.source),
    sourceFile: nullableString(input.sourceFile),
    importBatchId: nullableString(input.importBatchId),
    fingerprint: nullableString(input.fingerprint) ?? buildFingerprint(input),
    status: input.status ?? StatusType.ACTIVE,
    notes: nullableString(input.notes),
  };
}

type InvestmentDb = Pick<typeof prisma, "investmentAccount">;

async function ensureInvestmentAccount(
  tx: InvestmentDb,
  userId: string,
  input: CreateInvestmentInput,
) {
  if (!input.accountNumber?.trim()) return null;

  return tx.investmentAccount.upsert({
    where: {
      userId_institution_accountNumber: {
        userId,
        institution: input.institution?.trim() || "Fidelity Investments",
        accountNumber: input.accountNumber.trim(),
      },
    },
    create: {
      userId,
      institution: input.institution?.trim() || "Fidelity Investments",
      accountNumber: input.accountNumber.trim(),
      accountName: nullableString(input.accountName),
      currency: input.currency,
    },
    update: {
      accountName: nullableString(input.accountName),
      currency: input.currency,
    },
  });
}

export async function getInvestments(regionFilter?: "ALL" | "USA" | "GHANA") {
  try {
    const userId = await requireUserId();
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        ...(regionFilter && regionFilter !== "ALL"
          ? { region: regionFilter as RegionType }
          : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: investments, error: null };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve investments.",
    };
  }
}

export async function getInvestmentById(id: string) {
  try {
    const userId = await requireUserId();
    const investment = await prisma.investment.findFirst({
      where: { id, userId },
    });

    if (!investment) {
      return { success: false, data: null, error: "Investment not found." };
    }

    return { success: true, data: investment, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve investment.",
    };
  }
}

export async function createInvestment(input: CreateInvestmentInput) {
  try {
    const userId = await requireUserId();
    const normalized = normalizeCreate(input, userId);

    if (normalized.fingerprint) {
      const existing = await prisma.investment.findFirst({
        where: { userId, fingerprint: normalized.fingerprint },
      });
      if (existing) {
        return {
          success: false,
          duplicate: true,
          data: existing,
          error: "This investment record already exists.",
        };
      }
    }

    const account = await ensureInvestmentAccount(prisma, userId, input);
    const investment = await prisma.investment.create({
      data: {
        ...normalized,
        accountId: account?.id ?? null,
      },
    });

    revalidatePath("/portfolio");
    revalidatePath("/");
    return { success: true, duplicate: false, data: investment, error: null };
  } catch (error) {
    return {
      success: false,
      duplicate: false,
      error:
        error instanceof Error ? error.message : "Failed to save investment.",
    };
  }
}

export async function bulkImportInvestments(
  inputs: CreateInvestmentInput[],
): Promise<BulkImportResult> {
  try {
    const userId = await requireUserId();
    if (!Array.isArray(inputs) || inputs.length === 0) {
      return {
        success: false,
        imported: 0,
        duplicates: 0,
        error: "No records to import.",
      };
    }

    const fingerprints = inputs
      .map((item) => item.fingerprint?.trim())
      .filter((value): value is string => Boolean(value));

    const existing = fingerprints.length
      ? await prisma.investment.findMany({
          where: { userId, fingerprint: { in: fingerprints } },
          select: { fingerprint: true },
        })
      : [];

    const existingSet = new Set(
      existing
        .map((item) => item.fingerprint)
        .filter((v): v is string => Boolean(v)),
    );

    const seen = new Set<string>();
    const fresh = inputs.filter((item) => {
      const fp = item.fingerprint?.trim();
      if (!fp || existingSet.has(fp) || seen.has(fp)) return false;
      seen.add(fp);
      return true;
    });

    if (fresh.length === 0) {
      return { success: true, imported: 0, duplicates: inputs.length };
    }

    const importBatchId =
      fresh.find((item) => item.importBatchId)?.importBatchId ??
      crypto.randomUUID();

    /*
     * Resolve Fidelity accounts once, then insert the investment rows in bulk.
     *
     * The previous implementation performed an account upsert + investment
     * insert for every CSV row inside a single interactive transaction. A
     * 175-row Fidelity file could therefore execute hundreds of queries before
     * the transaction committed and exceed Prisma's default 5-second timeout.
     *
     * We now:
     *   1. Normalize the rows in memory.
     *   2. Resolve each unique account only once.
     *   3. Use createMany() for the investment rows.
     *   4. Keep the account creation and investment inserts atomic.
     *
     * The 30-second timeout is an additional safety margin, not the primary
     * performance fix.
     */
    const normalizedRows = fresh.map((input) =>
      normalizeCreate({ ...input, importBatchId }, userId),
    );

    type AccountKey = string;

    const accountInputs = new Map<
      AccountKey,
      {
        accountNumber: string;
        institution: string;
        accountName: string | null;
        currency: CurrencyType;
      }
    >();

    for (const input of fresh) {
      const accountNumber = input.accountNumber?.trim();
      if (!accountNumber) continue;

      const institution = input.institution?.trim() || "Fidelity Investments";

      const key = [
        userId,
        institution.toUpperCase(),
        accountNumber.toUpperCase(),
      ].join("|");

      if (!accountInputs.has(key)) {
        accountInputs.set(key, {
          accountNumber,
          institution,
          accountName: nullableString(input.accountName),
          currency: input.currency,
        });
      }
    }

    await prisma.$transaction(
      async (tx) => {
        const accountIds = new Map<AccountKey, string>();

        for (const [key, accountInput] of accountInputs) {
          const account = await tx.investmentAccount.upsert({
            where: {
              userId_institution_accountNumber: {
                userId,
                institution: accountInput.institution,
                accountNumber: accountInput.accountNumber,
              },
            },
            create: {
              userId,
              institution: accountInput.institution,
              accountNumber: accountInput.accountNumber,
              accountName: accountInput.accountName,
              currency: accountInput.currency,
            },
            update: {
              accountName: accountInput.accountName,
              currency: accountInput.currency,
            },
            select: {
              id: true,
            },
          });

          accountIds.set(key, account.id);
        }

        const rows = normalizedRows.map((row) => {
          const accountNumber = row.accountNumber;
          const institution = row.institution?.trim() || "Fidelity Investments";

          const key = accountNumber
            ? [
                userId,
                institution.toUpperCase(),
                accountNumber.toUpperCase(),
              ].join("|")
            : null;

          return {
            ...row,
            accountId: key ? (accountIds.get(key) ?? null) : null,
          };
        });

        await tx.investment.createMany({
          data: rows,
        });
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    revalidatePath("/portfolio");
    revalidatePath("/");
    return {
      success: true,
      imported: fresh.length,
      duplicates: inputs.length - fresh.length,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      duplicates: 0,
      error: error instanceof Error ? error.message : "Bulk import failed.",
    };
  }
}

export async function updateInvestment(
  id: string,
  input: CreateInvestmentInput,
) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.investment.findFirst({
      where: { id, userId },
    });
    if (!existing) return { success: false, error: "Investment not found." };

    const normalized = normalizeCreate(input, userId);
    if (normalized.fingerprint) {
      const conflict = await prisma.investment.findFirst({
        where: { userId, fingerprint: normalized.fingerprint, NOT: { id } },
      });
      if (conflict)
        return {
          success: false,
          duplicate: true,
          error: "Another investment record uses this fingerprint.",
        };
    }

    const account = await ensureInvestmentAccount(prisma, userId, input);
    const updated = await prisma.investment.update({
      where: { id },
      data: { ...normalized, accountId: account?.id ?? null },
    });

    revalidatePath("/portfolio");
    return { success: true, data: updated, duplicate: false };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update investment.",
    };
  }
}

export async function deleteInvestment(id: string) {
  try {
    const userId = await requireUserId();
    const result = await prisma.investment.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      return { success: false, error: "Investment not found." };
    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete investment.",
    };
  }
}
