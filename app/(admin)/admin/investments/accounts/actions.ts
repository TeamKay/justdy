"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

const providers = [
  "FIDELITY",
  "BANK_OF_GHANA",
  "GHANA_STOCK_EXCHANGE",
  "STANBIC",
  "MANUAL",
  "OTHER",
] as const;

const accountTypes = [
  "ROTH_IRA",
  "TREASURY_BILLS",
  "STOCKS",
  "MUTUAL_FUND",
  "CASH",
  "OTHER",
] as const;

const currencies = ["USD", "GHS"] as const;

const accountSchema = z.object({
  name: z.string().trim().min(2, "Enter an account name.").max(80),
  provider: z.enum(providers),
  type: z.enum(accountTypes),
  currency: z.enum(currencies),
  country: z.enum(["United States", "Ghana"]),
  notes: z.string().trim().max(2000, "Notes must be under 2,000 characters."),
});

export type AccountFormState = {
  error?: string;
};

export async function createInvestmentAccount(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  try {
    await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    type: formData.get("type"),
    currency: formData.get("currency"),
    country: formData.get("country"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your entries.",
    };
  }

  const data = parsed.data;
  let owner;

            try {
            owner = await authorizeInvestmentOwner();
            } catch (error) {
            if (error instanceof Error && error.message === "UNAUTHORIZED") {
                redirect("/login");
            }

            redirect("/admin");
            }

            const profile = await prisma.investmentProfile.upsert({
            where: {
                userId: owner.id,
            },
            update: {},
            create: {
                userId: owner.id,
            },
            select: {
                id: true,
            },
            });

  await prisma.investmentAccount.create({
    data: {
      profileId: profile.id,
      name: data.name,
      provider: data.provider,
      type: data.type,
      currency: data.currency,
      country: data.country,
      notes: data.notes || null,
    },
  });

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/accounts");

  redirect("/admin/investments/accounts");
}