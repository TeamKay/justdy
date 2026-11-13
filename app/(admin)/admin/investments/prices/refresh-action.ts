"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { refreshUsMarketPricesForProfile } from "@/lib/investments/refresh-us-market-prices";

export async function refreshUsMarketPrices() {
  let owner;
  try {
    owner = await authorizeInvestmentOwner();
  } catch {
    redirect("/admin");
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });
  if (!profile) redirect("/admin/investments?error=profile");

  const result = await refreshUsMarketPricesForProfile(profile.id);
  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/prices");
  const summary = encodeURIComponent(`${result.updated} updated of ${result.attempted}; ${result.failures.length} failed`);
  const details = encodeURIComponent(result.failures.slice(0, 5).join(" | "));
  redirect(`/admin/investments/prices?marketRefresh=${summary}${details ? `&marketErrors=${details}` : ""}`);
}
