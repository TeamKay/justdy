
"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import {
  CurrencyType,
  InvestmentAssetType,
  InvestmentImportStatus,
  InvestmentTransactionType,
} from "@/lib/generated/prisma/client";

function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(
    String(value).replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1"),
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (match) {
    const [, month, day, year] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function classifyTransaction(action: string):
  | InvestmentTransactionType
  | null {
  const normalized = action.toUpperCase();

  if (normalized.includes("YOU BOUGHT")) return "BUY";
  if (normalized.includes("YOU SOLD")) return "SELL";
  if (normalized.includes("CASH CONTRIBUTION")) return "CONTRIBUTION";
  if (normalized.includes("DIVIDEND RECEIVED")) return "DIVIDEND";
  if (normalized.includes("REINVESTMENT")) return "REINVESTMENT";
  if (normalized.includes("INTEREST")) return "INTEREST";
  if (normalized.includes("FEE")) return "FEE";
  if (normalized.includes("WITHDRAWAL")) return "WITHDRAWAL";

  return null;
}

function classifyAsset(
  symbol: string,
  description: string,
): InvestmentAssetType {
  const normalized = `${symbol} ${description}`.toUpperCase();

  if (
    normalized.includes("MONEY MARKET") ||
    symbol.toUpperCase().startsWith("SPAXX")
  ) {
    return "CASH";
  }

  if (normalized.includes("ETF")) return "ETF";

  return "STOCK";
}

function fingerprint(values: unknown[]) {
  return createHash("sha256")
    .update(values.map((value) => String(value ?? "")).join("|"))
    .digest("hex");
}

export async function importFidelityTransactions(formData: FormData) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const accountId = String(formData.get("accountId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/investments/imports/new?error=file");
  }

  if (
    !file.name.toLowerCase().endsWith(".csv") ||
    file.size > 5 * 1024 * 1024
  ) {
    redirect("/admin/investments/imports/new?error=format");
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments?error=profile");
  }

  const account = await prisma.investmentAccount.findFirst({
    where: {
      id: accountId,
      profileId: profile.id,
    },
    select: {
      id: true,
      currency: true,
      provider: true,
    },
  });

  if (!account) {
    redirect("/admin/investments/imports/new?error=account");
  }

  if (account.provider !== "FIDELITY") {
    redirect("/admin/investments/imports/new?error=provider");
  }

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    raw: false,
  });

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    redirect("/admin/investments/imports/new?error=csv");
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const headerIndex = matrix.findIndex((row) =>
    row.some((cell) => String(cell).trim() === "Run Date"),
  );

  if (headerIndex < 0) {
    redirect("/admin/investments/imports/new?error=columns");
  }

  const headers = matrix[headerIndex].map((value) =>
    String(value).trim(),
  );

  const column = (name: string) => headers.indexOf(name);

  const requiredColumns = [
    "Run Date",
    "Action",
    "Symbol",
    "Description",
    "Price ($)",
    "Quantity",
    "Commission ($)",
    "Fees ($)",
    "Amount ($)",
  ];

  if (requiredColumns.some((name) => column(name) < 0)) {
    redirect("/admin/investments/imports/new?error=columns");
  }

  const rows = matrix.slice(headerIndex + 1);

  const batch = await prisma.investmentImportBatch.create({
    data: {
      profileId: profile.id,
      accountId: account.id,
      fileName: file.name,
      source: "FIDELITY_CSV",
      status: InvestmentImportStatus.PROCESSING,
    },
  });

  let importedRows = 0;
  let skippedRows = 0;
  let failedRows = 0;

  const errors: string[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];

    const get = (name: string) => {
      const position = column(name);
      return position >= 0 ? row[position] : "";
    };

    const action = String(get("Action")).trim();

    // Ignore blank lines and Fidelity's legal/footer text.
    if (!action || !get("Run Date")) {
      continue;
    }

    const type = classifyTransaction(action);

    if (!type) {
      skippedRows++;
      continue;
    }

    const occurredAt = parseDate(get("Run Date"));
    const rawAmount = parseMoney(get("Amount ($)"));
    const quantity = parseMoney(get("Quantity"));
    const unitPrice = parseMoney(get("Price ($)"));
    const commission = parseMoney(get("Commission ($)")) ?? 0;
    const otherFees = parseMoney(get("Fees ($)")) ?? 0;

    if (
      !occurredAt ||
      rawAmount === null ||
      rawAmount === 0 ||
      commission < 0 ||
      otherFees < 0 ||
      (quantity !== null && quantity < 0) ||
      (unitPrice !== null && unitPrice < 0)
    ) {
      failedRows++;
      errors.push(`Row ${index + headerIndex + 2}: Invalid date or amount.`);
      continue;
    }

    const symbol = String(get("Symbol")).trim();
    const description = String(get("Description")).trim();
    const settlementDate = parseDate(get("Settlement Date"));

    const rowFingerprint = fingerprint([
      occurredAt.toISOString(),
      action,
      symbol,
      description,
      quantity,
      unitPrice,
      rawAmount,
      settlementDate?.toISOString(),
    ]);

    try {
      let assetId: string | undefined;

      if (symbol) {
        let asset = await prisma.investmentAsset.findFirst({
          where: {
            profileId: profile.id,
            symbol,
          },
          select: { id: true },
        });

        if (!asset) {
          asset = await prisma.investmentAsset.create({
            data: {
              profileId: profile.id,
              name: description || symbol,
              symbol,
              assetType: classifyAsset(symbol, description),
              currency: CurrencyType.USD,
              isActive: true,
            },
            select: { id: true },
          });
        }

        assetId = asset.id;
      }

      await prisma.investmentTransaction.create({
        data: {
          accountId: account.id,
          assetId,
          importBatchId: batch.id,
          type,
          occurredAt,
          currency: account.currency,
          amount: Math.abs(rawAmount).toString(),
          quantity:
            quantity !== null && quantity > 0
              ? quantity.toString()
              : undefined,
          unitPrice:
            unitPrice !== null && unitPrice > 0
              ? unitPrice.toString()
              : undefined,
          fees: (commission + otherFees).toString(),
          externalId: rowFingerprint,
          description: action,
        },
      });

      importedRows++;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        skippedRows++;
        continue;
      }

      failedRows++;
      errors.push(`Row ${index + headerIndex + 2}: Import failed.`);
    }
  }

  const status =
    failedRows > 0 && importedRows > 0
      ? InvestmentImportStatus.PARTIAL
      : failedRows > 0
        ? InvestmentImportStatus.FAILED
        : InvestmentImportStatus.COMPLETED;

  await prisma.investmentImportBatch.update({
    where: { id: batch.id },
    data: {
      totalRows: importedRows + skippedRows + failedRows,
      importedRows,
      skippedRows,
      failedRows,
      status,
      completedAt: new Date(),
      errorDetails: errors.length
        ? JSON.parse(JSON.stringify(errors))
        : undefined,
    },
  });

  revalidatePath("/admin/investments");
  revalidatePath("/admin/investments/assets");
  revalidatePath("/admin/investments/transactions");
  revalidatePath("/admin/investments/imports");

  redirect(`/admin/investments/imports?imported=${importedRows}&skipped=${skippedRows}&failed=${failedRows}`);
}
