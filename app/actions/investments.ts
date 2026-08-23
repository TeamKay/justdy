"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import {
  AssetType,
  CurrencyType,
  InvestmentTransactionType,
  RegionType,
  StatusType,
} from "@/lib/generated/prisma/client";

// ============================================================
// TYPES
// ============================================================

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

export interface UpdateInvestmentInput {
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

// ============================================================
// HELPERS
// ============================================================

/**
 * Calculate the USD value correctly.
 *
 * USD:
 *   amountUSD = amount
 *
 * GHS:
 *   amountUSD = amount * exchangeRate
 *
 * Assumes exchangeRate means:
 *   1 GHS = X USD
 */
function calculateAmountUSD(
  amount: number,
  currency: CurrencyType,
  exchangeRate: number,
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (currency === CurrencyType.USD) {
    return amount;
  }

  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    return 0;
  }

  return amount * exchangeRate;
}

/**
 * Convert optional numeric values safely.
 */
function nullableNumber(value?: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

/**
 * Normalize empty strings to null.
 */
function nullableString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

// ============================================================
// FETCH ALL INVESTMENTS
// ============================================================

export async function getInvestments(regionFilter?: "ALL" | "USA" | "GHANA") {
  try {
    const whereCondition =
      regionFilter && regionFilter !== "ALL"
        ? {
            region: regionFilter as RegionType,
          }
        : {};

    const investments = await prisma.investment.findMany({
      where: whereCondition,
      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return {
      success: true,
      data: investments,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch investments:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown database error while retrieving investments.";

    return {
      success: false,
      data: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Failed to retrieve investments: ${message}`
          : "Failed to retrieve investments.",
    };
  }
}

// ============================================================
// FETCH SINGLE INVESTMENT
// ============================================================

export async function getInvestmentById(id: string) {
  try {
    // Validate the ID before sending it to Prisma
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return {
        success: false,
        data: null,
        error: "Invalid investment ID.",
      };
    }

    const investmentId = id.trim();

    const investment = await prisma.investment.findUnique({
      where: {
        id: investmentId,
      },
    });

    if (!investment) {
      return {
        success: false,
        data: null,
        error: "Investment not found.",
      };
    }

    return {
      success: true,
      data: investment,
      error: null,
    };
  } catch (error) {
    // IMPORTANT: expose the real Prisma/database error in development
    console.error("Failed to fetch investment:", {
      id,
      error,
    });

    const message =
      error instanceof Error
        ? error.message
        : "Unknown database error while retrieving investment.";

    return {
      success: false,
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Failed to retrieve investment: ${message}`
          : "Failed to retrieve investment.",
    };
  }
}

// ============================================================
// SAVE NEW INVESTMENT
// ============================================================

export async function createInvestment(input: CreateInvestmentInput) {
  try {
    // --------------------------------------------------------
    // Normalize values
    // --------------------------------------------------------

    const amount = Number.isFinite(input.amount) ? input.amount : 0;

    const exchangeRate =
      input.exchangeRate !== undefined &&
      Number.isFinite(input.exchangeRate) &&
      input.exchangeRate > 0
        ? input.exchangeRate
        : 1;

    const amountUSD = calculateAmountUSD(amount, input.currency, exchangeRate);

    // --------------------------------------------------------
    // Prevent duplicate imports
    // --------------------------------------------------------

    const fingerprint = nullableString(input.fingerprint);

    if (fingerprint) {
      const existing = await prisma.investment.findUnique({
        where: {
          fingerprint,
        },
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

    // --------------------------------------------------------
    // Create investment
    // --------------------------------------------------------

    const newInvestment = await prisma.investment.create({
      data: {
        // ----------------------------------------------
        // Security
        // ----------------------------------------------

        name: input.name,

        tickerOrSymbol: nullableString(input.tickerOrSymbol),

        cusip: nullableString(input.cusip),

        // ----------------------------------------------
        // Fidelity / account
        // ----------------------------------------------

        accountNumber: nullableString(input.accountNumber),

        accountName: nullableString(input.accountName),

        institution:
          nullableString(input.institution) ?? "Fidelity Investments",

        // ----------------------------------------------
        // Classification
        // ----------------------------------------------

        assetClass: input.assetClass,

        region: input.region,

        currency: input.currency,

        type: input.type ?? InvestmentTransactionType.OTHER,

        // ----------------------------------------------
        // Transaction
        // ----------------------------------------------

        shares: nullableNumber(input.shares),

        pricePerShare: nullableNumber(input.pricePerShare),

        amount,

        grossAmount: nullableNumber(input.grossAmount) ?? amount,

        fees: Number.isFinite(input.fees ?? 0) ? (input.fees ?? 0) : 0,

        taxes: Number.isFinite(input.taxes ?? 0) ? (input.taxes ?? 0) : 0,

        // ----------------------------------------------
        // Performance
        // ----------------------------------------------

        costBasis: nullableNumber(input.costBasis),

        realizedGain: nullableNumber(input.realizedGain),

        marketValue: nullableNumber(input.marketValue),

        unrealizedGain: nullableNumber(input.unrealizedGain),

        unrealizedGainPercent: nullableNumber(input.unrealizedGainPercent),

        // ----------------------------------------------
        // Cash
        // ----------------------------------------------

        cashBalance: nullableNumber(input.cashBalance),

        // ----------------------------------------------
        // Currency
        // ----------------------------------------------

        exchangeRate,

        amountUSD,

        // ----------------------------------------------
        // Dates
        // ----------------------------------------------

        date: input.date ? new Date(input.date) : new Date(),

        settlementDate: input.settlementDate
          ? new Date(input.settlementDate)
          : null,

        // ----------------------------------------------
        // Import metadata
        // ----------------------------------------------

        source: nullableString(input.source),

        sourceFile: nullableString(input.sourceFile),

        importBatchId: nullableString(input.importBatchId),

        fingerprint,

        // ----------------------------------------------
        // Status
        // ----------------------------------------------

        status: input.status ?? StatusType.ACTIVE,

        // ----------------------------------------------
        // Notes
        // ----------------------------------------------

        notes: nullableString(input.notes),
      },
    });

    // Revalidate portfolio page
    revalidatePath("/");
    revalidatePath("/portfolio");

    return {
      success: true,
      data: newInvestment,
      duplicate: false,
    };
  } catch (error) {
    console.error("Failed to save investment:", error);

    // Handle Prisma unique fingerprint error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        duplicate: true,
        error: "This investment record already exists.",
      };
    }

    return {
      success: false,
      duplicate: false,
      error:
        error instanceof Error ? error.message : "Failed to save investment.",
    };
  }
}

// ============================================================
// UPDATE INVESTMENT
// ============================================================

export async function updateInvestment(
  id: string,
  data: UpdateInvestmentInput,
) {
  try {
    // --------------------------------------------------------
    // Normalize values
    // --------------------------------------------------------

    const amount = Number.isFinite(data.amount) ? data.amount : 0;

    const exchangeRate =
      data.exchangeRate !== undefined &&
      Number.isFinite(data.exchangeRate) &&
      data.exchangeRate > 0
        ? data.exchangeRate
        : 1;

    const amountUSD = calculateAmountUSD(amount, data.currency, exchangeRate);

    const fingerprint = nullableString(data.fingerprint);

    // --------------------------------------------------------
    // Prevent changing to another existing fingerprint
    // --------------------------------------------------------

    if (fingerprint) {
      const existing = await prisma.investment.findFirst({
        where: {
          fingerprint,
          NOT: {
            id,
          },
        },
      });

      if (existing) {
        return {
          success: false,
          duplicate: true,
          data: existing,
          error: "Another investment record already uses this fingerprint.",
        };
      }
    }

    // --------------------------------------------------------
    // Update
    // --------------------------------------------------------

    const updated = await prisma.investment.update({
      where: {
        id,
      },

      data: {
        // ----------------------------------------------
        // Security
        // ----------------------------------------------

        name: data.name,

        tickerOrSymbol: nullableString(data.tickerOrSymbol),

        cusip: nullableString(data.cusip),

        // ----------------------------------------------
        // Account
        // ----------------------------------------------

        accountNumber: nullableString(data.accountNumber),

        accountName: nullableString(data.accountName),

        institution: nullableString(data.institution) ?? "Fidelity Investments",

        // ----------------------------------------------
        // Classification
        // ----------------------------------------------

        assetClass: data.assetClass,

        region: data.region,

        currency: data.currency,

        type: data.type,

        // ----------------------------------------------
        // Transaction
        // ----------------------------------------------

        shares: nullableNumber(data.shares),

        pricePerShare: nullableNumber(data.pricePerShare),

        amount,

        grossAmount: nullableNumber(data.grossAmount) ?? amount,

        fees: Number.isFinite(data.fees ?? 0) ? (data.fees ?? 0) : 0,

        taxes: Number.isFinite(data.taxes ?? 0) ? (data.taxes ?? 0) : 0,

        // ----------------------------------------------
        // Performance
        // ----------------------------------------------

        costBasis: nullableNumber(data.costBasis),

        realizedGain: nullableNumber(data.realizedGain),

        marketValue: nullableNumber(data.marketValue),

        unrealizedGain: nullableNumber(data.unrealizedGain),

        unrealizedGainPercent: nullableNumber(data.unrealizedGainPercent),

        // ----------------------------------------------
        // Cash
        // ----------------------------------------------

        cashBalance: nullableNumber(data.cashBalance),

        // ----------------------------------------------
        // Currency
        // ----------------------------------------------

        exchangeRate,

        amountUSD,

        // ----------------------------------------------
        // Dates
        // ----------------------------------------------

        ...(data.date
          ? {
              date: new Date(data.date),
            }
          : {}),

        ...(data.settlementDate
          ? {
              settlementDate: new Date(data.settlementDate),
            }
          : {
              settlementDate: null,
            }),

        // ----------------------------------------------
        // Import metadata
        // ----------------------------------------------

        source: nullableString(data.source),

        sourceFile: nullableString(data.sourceFile),

        importBatchId: nullableString(data.importBatchId),

        fingerprint,

        // ----------------------------------------------
        // Status
        // ----------------------------------------------

        status: data.status ?? StatusType.ACTIVE,

        // ----------------------------------------------
        // Notes
        // ----------------------------------------------

        notes: nullableString(data.notes),
      },
    });

    revalidatePath("/");
    revalidatePath("/portfolio");

    return {
      success: true,
      data: updated,
      duplicate: false,
    };
  } catch (error) {
    console.error("Failed to update investment:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        duplicate: true,
        error: "Another investment record already uses this fingerprint.",
      };
    }

    return {
      success: false,
      duplicate: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update investment in database.",
    };
  }
}

// ============================================================
// DELETE INVESTMENT
// ============================================================

export async function deleteInvestment(id: string) {
  try {
    await prisma.investment.delete({
      where: {
        id,
      },
    });

    revalidatePath("/");
    revalidatePath("/portfolio");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete investment:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete investment from database.",
    };
  }
}
