"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { CurrencyType } from "@/lib/generated/prisma/client";

const priceSchema = z.object({
  assetId: z.string().min(1),
  price: z.coerce.number().positive().finite(),
  currency: z.enum(["USD", "GHS"]),
  priceDate: z.string().min(1),
});

const exchangeRateSchema = z.object({
  baseCurrency: z.enum(["USD", "GHS"]),
  quoteCurrency: z.enum(["USD", "GHS"]),
  rate: z.coerce.number().positive().finite(),
  rateDate: z.string().min(1),
}).refine((value) => value.baseCurrency !== value.quoteCurrency, {
  message: "Choose two different currencies.",
  path: ["quoteCurrency"],
});

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

async function getOwnerProfile() {
  let owner;
  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    redirect("/admin");
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });
  if (!profile) redirect("/admin/investments?error=profile");
  return profile;
}

export async function saveAssetPrice(formData: FormData) {
  const profile = await getOwnerProfile();
  const parsed = priceSchema.safeParse({
    assetId: String(formData.get("assetId") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    priceDate: String(formData.get("priceDate") ?? ""),
  });

  if (!parsed.success) redirect("/admin/investments/prices?error=price");
  const priceDate = parseDate(parsed.data.priceDate);
  if (!priceDate) redirect("/admin/investments/prices?error=date");

  const asset = await prisma.investmentAsset.findFirst({
    where: { id: parsed.data.assetId, profileId: profile.id, isActive: true },
    select: { id: true },
  });
  if (!asset) redirect("/admin/investments/prices?error=asset");

  await prisma.investmentPriceHistory.upsert({
    where: {
      assetId_priceDate_source: {
        assetId: asset.id,
        priceDate,
        source: "MANUAL",
      },
    },
    update: {
      price: parsed.data.price.toString(),
      currency: parsed.data.currency as CurrencyType,
      isEstimated: false,
    },
    create: {
      assetId: asset.id,
      priceDate,
      price: parsed.data.price.toString(),
      currency: parsed.data.currency as CurrencyType,
      source: "MANUAL",
      isEstimated: false,
    },
  });

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/prices");
  redirect("/admin/investments/prices?saved=price");
}

export async function saveExchangeRate(formData: FormData) {
  const profile = await getOwnerProfile();
  void profile;
  const parsed = exchangeRateSchema.safeParse({
    baseCurrency: String(formData.get("baseCurrency") ?? ""),
    quoteCurrency: String(formData.get("quoteCurrency") ?? ""),
    rate: String(formData.get("rate") ?? ""),
    rateDate: String(formData.get("rateDate") ?? ""),
  });

  if (!parsed.success) redirect("/admin/investments/prices?error=rate");
  const rateDate = parseDate(parsed.data.rateDate);
  if (!rateDate) redirect("/admin/investments/prices?error=date");

  await prisma.investmentExchangeRate.upsert({
    where: {
      baseCurrency_quoteCurrency_rateDate_source: {
        baseCurrency: parsed.data.baseCurrency as CurrencyType,
        quoteCurrency: parsed.data.quoteCurrency as CurrencyType,
        rateDate,
        source: "MANUAL",
      },
    },
    update: { rate: parsed.data.rate.toString() },
    create: {
      baseCurrency: parsed.data.baseCurrency as CurrencyType,
      quoteCurrency: parsed.data.quoteCurrency as CurrencyType,
      rateDate,
      rate: parsed.data.rate.toString(),
      source: "MANUAL",
    },
  });

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/prices");
  redirect("/admin/investments/prices?saved=rate");
}
