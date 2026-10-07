import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/investments/admin";
import {
  makeFingerprint,
  normalizeTransactionType,
  parseDate,
  parseImportFile,
  parseMoney,
  parseQuantity,
  type ImportMapping,
} from "@/lib/investments/importer";
import prisma from "@/lib/prisma";
import { recalculateHolding } from "@/lib/investments/engine";

export const runtime = "nodejs";

const VALID_TYPES = new Set([
  "BUY",
  "SELL",
  "DIVIDEND",
  "DRIP",
  "INTEREST",
  "FEE",
  "TAX",
  "CONTRIBUTION",
  "WITHDRAWAL",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "CASH",
  "HOLDING_SNAPSHOT",
  "OTHER",
]);

const VALID_CURRENCIES = new Set(["USD", "GHS"]);

function getMappedValue(
  row: Record<string, string>,
  column: string | undefined,
): string | undefined {
  if (!column) {
    return undefined;
  }

  return row[column];
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminApi();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const accountId = String(
      form.get("accountId") ?? "",
    );
    const reportType = String(
      form.get("reportType") ?? "CSV_EXPORT",
    );
    const mappingRaw = String(
      form.get("mapping") ?? "{}",
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A CSV or Excel file is required." },
        { status: 400 },
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Select an investment account." },
        { status: 400 },
      );
    }

    let mapping: ImportMapping;

    try {
      mapping = JSON.parse(mappingRaw) as ImportMapping;
    } catch {
      return NextResponse.json(
        { error: "Invalid column mapping." },
        { status: 400 },
      );
    }

    const account =
      await prisma.investmentAccount.findFirst({
        where: {
          id: accountId,
          userId: user.id,
        },
      });

    if (!account) {
      return NextResponse.json(
        { error: "Investment account not found." },
        { status: 404 },
      );
    }

    if (!mapping.date || !mapping.type) {
      return NextResponse.json(
        {
          error:
            "Map both Date and Transaction Type before importing.",
        },
        { status: 400 },
      );
    }

    const parsed = parseImportFile(
      file.name,
      Buffer.from(await file.arrayBuffer()),
    );

    const report = await prisma.investmentReport.create({
      data: {
        userId: user.id,
        accountId,
        fileName: file.name,
        mimeType:
          file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        reportType: reportType as never,
        transactionCount: parsed.rows.length,
        importStatus: "REVIEW",
        metadata: { mapping },
      },
    });

    let importedCount = 0;
    let duplicateCount = 0;
    let rejectedCount = 0;

    const errors: string[] = [];
    const touchedPairs = new Set<string>();

    for (
      let index = 0;
      index < parsed.rows.length;
      index += 1
    ) {
      const row = parsed.rows[index];

      const date = parseDate(
        getMappedValue(row, mapping.date),
      );

      const type = normalizeTransactionType(
        getMappedValue(row, mapping.type),
      );

      const quantity = parseQuantity(
        getMappedValue(row, mapping.quantity),
      );

      const price = parseMoney(
        getMappedValue(row, mapping.price),
      );

      const grossAmount = parseMoney(
        getMappedValue(row, mapping.grossAmount),
      );

      const fees =
        parseMoney(
          getMappedValue(row, mapping.fees),
        ) ?? 0;

      const taxes =
        parseMoney(
          getMappedValue(row, mapping.taxes),
        ) ?? 0;

      const netAmount = parseMoney(
        getMappedValue(row, mapping.netAmount),
      );

      const currencyValue = (
        getMappedValue(row, mapping.currency) ||
        account.currency ||
        "USD"
      ).toUpperCase();

      const currency = VALID_CURRENCIES.has(
        currencyValue,
      )
        ? currencyValue
        : account.currency;

      if (
        !date ||
        !type ||
        !VALID_TYPES.has(type)
      ) {
        rejectedCount++;

        if (errors.length < 10) {
          errors.push(
            `Row ${
              index + 2
            }: date or transaction type could not be interpreted.`,
          );
        }

        continue;
      }

      const symbol =
        getMappedValue(row, mapping.symbol)
          ?.trim() || "";

      const name =
        getMappedValue(row, mapping.name)
          ?.trim() ||
        symbol ||
        `Imported asset ${index + 1}`;

      let assetId: string | null = null;

      if (symbol || name) {
        const existing =
          await prisma.investmentAsset.findFirst({
            where: {
              userId: user.id,
              OR: [
                ...(symbol ? [{ symbol }] : []),
                ...(symbol
                  ? [{ tickerOrSymbol: symbol }]
                  : []),
                { name },
              ],
            },
          });

        if (existing) {
          assetId = existing.id;
        } else {
          const created =
            await prisma.investmentAsset.create({
              data: {
                userId: user.id,
                accountId,
                name,
                symbol: symbol || null,
                tickerOrSymbol: symbol || null,
                assetType: "OTHER",
                region:
                  account.country?.toUpperCase() ===
                  "GHANA"
                    ? "GHANA"
                    : "USA",
                currency:
                  currency as "USD" | "GHS",
              },
            });

          assetId = created.id;
        }
      }

      const fingerprint = makeFingerprint({
        userId: user.id,
        accountId,
        assetId,
        type,
        date: date.toISOString(),
        quantity,
        price,
        grossAmount,
        fees,
        taxes,
        netAmount,
      });

      try {
        await prisma.investmentTransaction.create({
          data: {
            userId: user.id,
            accountId,
            assetId,
            type: type as never,
            transactionDate: date,
            quantity:
              quantity == null
                ? null
                : String(quantity),
            price:
              price == null
                ? null
                : String(price),
            grossAmount:
              grossAmount == null
                ? null
                : String(grossAmount),
            fees: String(fees),
            taxes: String(taxes),
            netAmount:
              netAmount == null
                ? null
                : String(netAmount),
            currency:
              currency as "USD" | "GHS",
            source: "IMPORT",
            sourceReference: file.name,
            sourceReportId: report.id,
            sourceRowNumber: index + 2,
            fingerprint,
            importStatus: "IMPORTED",
            notes:
              getMappedValue(row, mapping.notes) ||
              null,
          },
        });

        importedCount++;

        if (assetId) {
          touchedPairs.add(
            `${accountId}:${assetId}`,
          );
        }
      } catch (error) {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "P2002"
        ) {
          duplicateCount++;
        } else {
          rejectedCount++;

          if (errors.length < 10) {
            errors.push(
              `Row ${
                index + 2
              }: transaction could not be imported.`,
            );
          }
        }
      }
    }

    for (const pair of touchedPairs) {
      const [touchedAccountId, assetId] =
        pair.split(":");

      await recalculateHolding(
        user.id,
        touchedAccountId,
        assetId,
      );
    }

    const status =
      rejectedCount && importedCount
        ? "PARTIALLY_IMPORTED"
        : rejectedCount
          ? "FAILED"
          : duplicateCount && !importedCount
            ? "DUPLICATE"
            : "IMPORTED";

    await prisma.investmentReport.update({
      where: {
        id: report.id,
      },
      data: {
        importedCount,
        duplicateCount,
        rejectedCount,
        importStatus: status,
        processedAt: new Date(),
        errorMessage:
          errors.length
            ? errors.join("\n")
            : null,
      },
    });

    await prisma.investmentAuditLog.create({
      data: {
        userId: user.id,
        action: "INVESTMENT_IMPORT",
        entityType: "InvestmentReport",
        entityId: report.id,
        details: {
          fileName: file.name,
          importedCount,
          duplicateCount,
          rejectedCount,
        },
      },
    });

    return NextResponse.json({
      reportId: report.id,
      importedCount,
      duplicateCount,
      rejectedCount,
      status,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to import transactions.",
      },
      { status: 400 },
    );
  }
}
