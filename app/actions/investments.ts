"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import {
  AssetType,
  CurrencyType,
  RegionType,
  TransactionType,
} from "@/lib/generated/prisma/client";

export interface CreateInvestmentInput {
  name: string;
  tickerOrSymbol?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  type: TransactionType;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  exchangeRate: number;
  date?: Date;
  notes?: string | null;
}

export interface UpdateInvestmentInput {
  name: string;
  tickerOrSymbol?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  type: TransactionType;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  exchangeRate: number;
  date?: Date;
  notes?: string | null;
}

/**
 * FETCH ALL INVESTMENTS FROM DATABASE
 */
export async function getInvestments(regionFilter?: "ALL" | "USA" | "GHANA") {
  try {
    const whereCondition =
      regionFilter && regionFilter !== "ALL"
        ? { region: regionFilter as RegionType }
        : {};

    const investments = await prisma.investment.findMany({
      where: whereCondition,
      orderBy: { date: "desc" },
    });

    return { success: true, data: investments };
  } catch (error) {
    console.error("Failed to fetch investments:", error);
    return { success: false, error: "Failed to retrieve investments." };
  }
}

/**
 * SAVE A NEW INVESTMENT TO DATABASE
 */
export async function createInvestment(input: CreateInvestmentInput) {
  try {
    const computedAmountUSD = input.amount * input.exchangeRate;

    const newInvestment = await prisma.investment.create({
      data: {
        name: input.name,
        tickerOrSymbol: input.tickerOrSymbol || null,
        assetClass: input.assetClass,
        region: input.region,
        currency: input.currency,
        type: input.type || "BUY",
        shares: input.shares || null,
        pricePerShare: input.pricePerShare || null,
        amount: input.amount,
        exchangeRate: input.exchangeRate,
        amountUSD: computedAmountUSD,
        date: input.date ? new Date(input.date) : new Date(), // <-- Pass incoming date
        status: "ACTIVE",
        returnRate: "+0.0%",
        isPositive: true,
        notes: input.notes || null,
      },
    });

    revalidatePath("/");

    return { success: true, data: newInvestment };
  } catch (error) {
    console.error("Failed to save investment:", error);
    return { success: false, error: "Failed to save investment." };
  }
}

/**
 * UPDATE AN INVESTMENT
 */
export async function updateInvestment(
  id: string,
  data: UpdateInvestmentInput,
) {
  try {
    const amountUSD =
      data.currency === "USD" ? data.amount : data.amount * data.exchangeRate;

    const updated = await prisma.investment.update({
      where: { id },
      data: {
        name: data.name,
        tickerOrSymbol: data.tickerOrSymbol || null,
        assetClass: data.assetClass,
        region: data.region,
        currency: data.currency,
        type: data.type,
        shares: data.shares || null,
        pricePerShare: data.pricePerShare || null,
        amount: data.amount,
        exchangeRate: data.exchangeRate,
        amountUSD,
        date: data.date ? new Date(data.date) : undefined, // <-- Pass updated date
        notes: data.notes || null,
      },
    });

    revalidatePath("/");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update investment:", error);
    return {
      success: false,
      error: "Failed to update investment in database.",
    };
  }
}

/**
 * DELETE AN INVESTMENT
 */
export async function deleteInvestment(id: string) {
  try {
    await prisma.investment.delete({
      where: { id },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete investment:", error);
    return {
      success: false,
      error: "Failed to delete investment from database.",
    };
  }
}
