"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import {
  CurrencyType,
  InvestmentAssetType,
} from "@/lib/generated/prisma/client";

const assetSchema = z.object({
  name: z.string().trim().min(1, "Enter an investment name.").max(150),
  symbol: z.string().trim().max(40).optional(),
  assetType: z.enum([
    "STOCK",
    "ETF",
    "MUTUAL_FUND",
    "TREASURY_BILL",
    "CASH",
    "OTHER",
  ]),
  currency: z.enum(["USD", "GHS"]),
  exchange: z.string().trim().max(100).optional(),
  externalSymbol: z.string().trim().max(100).optional(),
});

export async function createInvestmentAsset(formData: FormData) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const parsed = assetSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? ""),
    assetType: String(formData.get("assetType") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    exchange: String(formData.get("exchange") ?? ""),
    externalSymbol: String(formData.get("externalSymbol") ?? ""),
  });

  if (!parsed.success) {
    redirect("/admin/investments/assets/new?error=invalid");
  }

  const data = parsed.data;
  const symbol = data.symbol?.trim() || null;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments?error=profile");
  }

  // Avoid duplicate symbols within this investment profile.
  // Different assets can still share the same name.
  if (symbol) {
    const existingAsset = await prisma.investmentAsset.findFirst({
      where: {
        profileId: profile.id,
        symbol,
      },
      select: { id: true },
    });

    if (existingAsset) {
      redirect("/admin/investments/assets/new?error=duplicate");
    }
  }

  try {
    await prisma.investmentAsset.create({
      data: {
        profileId: profile.id,
        name: data.name,
        symbol,
        assetType: data.assetType as InvestmentAssetType,
        currency: data.currency as CurrencyType,
        exchange: data.exchange?.trim() || null,
        externalSymbol: data.externalSymbol?.trim() || null,
      },
    });
  } catch (error) {
    // Handle a duplicate symbol if another request created it concurrently.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      redirect("/admin/investments/assets/new?error=duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/assets");
  revalidatePath("/admin/investments/transactions/new");

  redirect("/admin/investments/assets?created=1");
}