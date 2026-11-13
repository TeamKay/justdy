
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

export type TreasuryBillFormState = {
  error?: string;
};

const schema = z.object({
  accountId: z.string().min(1, "Select an investment account."),
  name: z.string().trim().min(2).max(100),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid purchase date."),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid maturity date."),
  purchasePrice: z.coerce.number().positive("Purchase price must be positive."),
  faceValue: z.coerce.number().positive("Face value must be positive."),
  fees: z.coerce.number().min(0, "Fees cannot be negative."),
  annualizedYield: z.union([
    z.literal(""),
    z.coerce.number().min(0).max(100),
  ]),
  notes: z.string().trim().max(2000),
}).refine(
  (data) => data.maturityDate > data.purchaseDate,
  {
    message: "Maturity date must be after purchase date.",
    path: ["maturityDate"],
  },
).refine(
  (data) => data.faceValue >= data.purchasePrice,
  {
    message: "Face value must be at least the purchase price.",
    path: ["faceValue"],
  },
);

export async function createTreasuryBill(
  _previousState: TreasuryBillFormState,
  formData: FormData,
): Promise<TreasuryBillFormState> {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const parsed = schema.safeParse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    purchaseDate: formData.get("purchaseDate"),
    maturityDate: formData.get("maturityDate"),
    purchasePrice: formData.get("purchasePrice"),
    faceValue: formData.get("faceValue"),
    fees: formData.get("fees") || "0",
    annualizedYield: formData.get("annualizedYield") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your entries.",
    };
  }

  const data = parsed.data;

  const purchaseDate = new Date(`${data.purchaseDate}T00:00:00.000Z`);
  const maturityDate = new Date(`${data.maturityDate}T00:00:00.000Z`);

  const profile = await prisma.investmentProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
    select: { id: true },
  });

  const account = await prisma.investmentAccount.findFirst({
    where: {
      id: data.accountId,
      profileId: profile.id,
      isActive: true,
    },
    select: {
      id: true,
      currency: true,
    },
  });

  if (!account) {
    return { error: "The selected investment account was not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const asset = await tx.investmentAsset.create({
        data: {
          profileId: profile.id,
          name: data.name,
          assetType: "TREASURY_BILL",
          currency: account.currency,
          isActive: true,
          treasuryBill: {
            create: {
              purchaseDate,
              maturityDate,
              purchasePrice: data.purchasePrice,
              faceValue: data.faceValue,
              annualizedYield:
                data.annualizedYield === ""
                  ? null
                  : data.annualizedYield / 100,
              status: "ACTIVE",
              notes: data.notes || null,
            },
          },
        },
      });

      await tx.investmentTransaction.create({
        data: {
          accountId: account.id,
          assetId: asset.id,
          type: "BUY",
          occurredAt: purchaseDate,
          currency: account.currency,
          amount: data.purchasePrice,
          quantity: 1,
          unitPrice: data.purchasePrice,
          fees: data.fees,
          description: `Treasury bill purchase: ${data.name}`,
          notes: data.notes || null,
        },
      });
    });
  } catch {
    return {
      error: "Unable to create the Treasury bill. Please try again.",
    };
  }

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/treasury-bills");

  redirect("/admin/investments/treasury-bills");
}


export async function redeemTreasuryBill(
  _previousState: TreasuryBillFormState,
  formData: FormData,
): Promise<TreasuryBillFormState> {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const schema = z.object({
    billId: z.string().min(1),
    actualProceeds: z.coerce.number().positive(
      "Redemption proceeds must be positive.",
    ),
    redeemedAt: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Enter a valid redemption date.",
    ),
  });

  const parsed = schema.safeParse({
    billId: formData.get("billId"),
    actualProceeds: formData.get("actualProceeds"),
    redeemedAt: formData.get("redeemedAt"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your entries.",
    };
  }

  const data = parsed.data;
  const redeemedAt = new Date(`${data.redeemedAt}T00:00:00.000Z`);

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    return { error: "Investment profile not found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const bill = await tx.investmentTreasuryBill.findFirst({
        where: {
          id: data.billId,
          asset: {
            profileId: profile.id,
          },
          status: {
            in: ["ACTIVE", "MATURED"],
          },
        },
        select: {
          id: true,
          assetId: true,
          asset: {
            select: {
              currency: true,
              name: true,
            },
          },
        },
      });

      if (!bill) {
        throw new Error("BILL_NOT_AVAILABLE");
      }

      const purchaseTransaction =
        await tx.investmentTransaction.findFirst({
          where: {
            assetId: bill.assetId,
            type: "BUY",
          },
          select: {
            accountId: true,
          },
        });

      if (!purchaseTransaction) {
        throw new Error("PURCHASE_ACCOUNT_NOT_FOUND");
      }

      const updated = await tx.investmentTreasuryBill.updateMany({
        where: {
          id: bill.id,
          status: {
            in: ["ACTIVE", "MATURED"],
          },
        },
        data: {
          status: "REDEEMED",
          redeemedAt,
          actualProceeds: data.actualProceeds,
        },
      });

      if (updated.count !== 1) {
        throw new Error("BILL_ALREADY_REDEEMED");
      }

      await tx.investmentTransaction.create({
        data: {
          accountId: purchaseTransaction.accountId,
          assetId: bill.assetId,
          type: "MATURITY",
          occurredAt: redeemedAt,
          currency: bill.asset.currency,
          amount: data.actualProceeds,
          quantity: 1,
          unitPrice: data.actualProceeds,
          fees: 0,
          description: `Treasury bill redemption: ${bill.asset.name}`,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "BILL_NOT_AVAILABLE" ||
          error.message === "BILL_ALREADY_REDEEMED") {
        return { error: "This Treasury bill is no longer available for redemption." };
      }

      if (error.message === "PURCHASE_ACCOUNT_NOT_FOUND") {
        return { error: "The original investment account could not be found." };
      }
    }

    return { error: "Unable to redeem this Treasury bill. Please try again." };
  }

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/treasury-bills");

  redirect("/admin/investments/treasury-bills");
}
