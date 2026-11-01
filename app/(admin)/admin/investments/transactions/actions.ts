"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import {
  CurrencyType,
  InvestmentTransactionType,
} from "@/lib/generated/prisma/client";

const transactionSchema = z.object({
  accountId: z.string().min(1, "Select an investment account."),
  assetId: z.string().optional(),
  type: z.enum([
    "CONTRIBUTION",
    "DEPOSIT",
    "BUY",
    "SELL",
    "DIVIDEND",
    "INTEREST",
    "FEE",
    "WITHDRAWAL",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "MATURITY",
    "REINVESTMENT",
    "ADJUSTMENT",
  ]),
  occurredAt: z.string().min(1, "Enter the transaction date."),
  currency: z.enum(["USD", "GHS"]),
  amount: z.string().min(1, "Enter the transaction amount."),
  quantity: z.string().optional(),
  unitPrice: z.string().optional(),
  fees: z.string().optional(),
  externalId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

function optionalPositiveNumber(value: string | undefined) {
  if (!value?.trim()) return undefined;

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? value
    : undefined;
}

export async function createInvestmentTransaction(
  formData: FormData,
) {
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

  const raw = {
    accountId: String(formData.get("accountId") ?? ""),
    assetId: String(formData.get("assetId") ?? ""),
    type: String(formData.get("type") ?? ""),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unitPrice: String(formData.get("unitPrice") ?? ""),
    fees: String(formData.get("fees") ?? ""),
    externalId: String(formData.get("externalId") ?? ""),
    description: String(formData.get("description") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = transactionSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(
      "/admin/investments/transactions/new?error=invalid",
    );
  }

  const data = parsed.data;

  const amount = Number(data.amount);
  const quantity = optionalPositiveNumber(data.quantity);
  const unitPrice = optionalPositiveNumber(data.unitPrice);
  const fees = optionalPositiveNumber(data.fees ?? "0") ?? "0";
  const occurredAt = new Date(data.occurredAt);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(occurredAt.getTime()) ||
    (data.quantity?.trim() && quantity === undefined) ||
    (data.unitPrice?.trim() && unitPrice === undefined) ||
    (data.fees?.trim() && optionalPositiveNumber(data.fees) === undefined)
  ) {
    redirect(
      "/admin/investments/transactions/new?error=invalid",
    );
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments?error=profile");
  }

  // Verify the account belongs to this owner's investment profile.
  const account = await prisma.investmentAccount.findFirst({
    where: {
      id: data.accountId,
      profileId: profile.id,
    },
    select: {
      id: true,
    },
  });

  if (!account) {
    redirect(
      "/admin/investments/transactions/new?error=account",
    );
  }

  // Assets are profile-level records, so the same institution can
  // hold many different investments without duplicating the institution.
  const assetId = data.assetId?.trim() || undefined;

  if (assetId) {
    const asset = await prisma.investmentAsset.findFirst({
      where: {
        id: assetId,
        profileId: profile.id,
      },
      select: { id: true },
    });

    if (!asset) {
      redirect(
        "/admin/investments/transactions/new?error=asset",
      );
    }
  }

  try {
    await prisma.investmentTransaction.create({
      data: {
        accountId: account.id,
        assetId,
        type: data.type as InvestmentTransactionType,
        occurredAt,
        currency: data.currency as CurrencyType,
        amount: amount.toString(),
        quantity:
          quantity === undefined ? undefined : quantity.toString(),
        unitPrice:
          unitPrice === undefined ? undefined : unitPrice.toString(),
        fees: fees.toString(),
        externalId: data.externalId?.trim() || undefined,
description: data.description?.trim() || undefined,
notes: data.notes?.trim() || undefined,
      },
    });
  } catch (error) {
    // The schema has a unique constraint on accountId + externalId.
    // A duplicate statement/reference ID should not create a second record.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      redirect(
        "/admin/investments/transactions/new?error=duplicate",
      );
    }

    throw error;
  }

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/accounts");
  revalidatePath("/admin/investments/transactions");

  redirect("/admin/investments/transactions?created=1");
}