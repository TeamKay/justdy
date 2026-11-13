
import "server-only";

import prisma from "@/lib/prisma";

const YAHOO_CHART_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/";
const SOURCE = "YAHOO_FINANCE";

type YahooChartResponse = {
  chart?: {
    error?: { description?: string } | null;
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }> | null;
  };
};

function marketDate(timestamp: number) {
  const date = new Date(timestamp * 1000);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

export async function refreshUsMarketPricesForProfile(
  profileId: string,
) {
  const assets = await prisma.investmentAsset.findMany({
    where: {
      profileId,
      isActive: true,
      currency: "USD",
      assetType: { in: ["STOCK", "ETF", "MUTUAL_FUND", "OTHER"] },
      OR: [
        { symbol: { not: null } },
        { externalSymbol: { not: null } },
        {
          name: {
            contains: "SPAXX",
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      externalSymbol: true,
    },
  });

  console.log(
  "[INVESTMENT PRICE REFRESH] Selected assets:",
  assets.map((asset) => ({
    name: asset.name,
    symbol: asset.symbol,
    externalSymbol: asset.externalSymbol,
    id: asset.id,
  })),
);

const spaxxCheck = await prisma.investmentAsset.findMany({
  where: {
    profileId,
    name: {
      contains: "SPAXX",
      mode: "insensitive",
    },
  },
  select: {
    id: true,
    name: true,
    symbol: true,
    externalSymbol: true,
    assetType: true,
    currency: true,
    isActive: true,
  },
});

console.log("[SPAXX DATABASE CHECK]", spaxxCheck);

  let updated = 0;
  const failures: string[] = [];

  for (const asset of assets) {
    // Prefer explicitly stored ticker fields.
    // SPAXX is a fallback for the existing asset name.
    const ticker = (
      asset.externalSymbol ||
      asset.symbol ||
      (/\bSPAXX\b/i.test(asset.name) ? "SPAXX" : "")
    ).trim();

    if (!ticker || !/^[A-Za-z0-9.^=-]{1,24}$/.test(ticker)) {
      failures.push(`${asset.name}: invalid or missing ticker`);
      continue;
    }

    try {
      const response = await fetch(
        `${YAHOO_CHART_URL}${encodeURIComponent(ticker)}?range=5d&interval=1d&events=div%2Csplits`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 investment-dashboard/1.0",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(12_000),
        },
      );

      if (!response.ok) {
        throw new Error(
          `provider returned HTTP ${response.status}`,
        );
      }

      const payload =
        (await response.json()) as YahooChartResponse;

      const result = payload.chart?.result?.[0];

      if (!result || payload.chart?.error) {
        throw new Error(
          payload.chart?.error?.description ||
            "no quote returned",
        );
      }

      const closes =
        result.indicators?.quote?.[0]?.close ?? [];
      const timestamps = result.timestamp ?? [];

      let quote: {
        price: number;
        timestamp: number;
      } | null = null;

      for (
        let index = closes.length - 1;
        index >= 0;
        index -= 1
      ) {
        const price = closes[index];
        const timestamp = timestamps[index];

        if (
          typeof price === "number" &&
          Number.isFinite(price) &&
          price > 0 &&
          typeof timestamp === "number"
        ) {
          quote = { price, timestamp };
          break;
        }
      }

      if (!quote) {
        const price = result.meta?.regularMarketPrice;
        const timestamp = result.meta?.regularMarketTime;

        if (
          typeof price === "number" &&
          Number.isFinite(price) &&
          price > 0 &&
          typeof timestamp === "number"
        ) {
          quote = { price, timestamp };
        }
      }

      if (!quote) {
        throw new Error(
          "provider returned no valid closing price",
        );
      }

      const priceDate = marketDate(quote.timestamp);

      await prisma.investmentPriceHistory.upsert({
        where: {
          assetId_priceDate_source: {
            assetId: asset.id,
            priceDate,
            source: SOURCE,
          },
        },
        update: {
          price: quote.price.toString(),
          currency: "USD",
          isEstimated: false,
        },
        create: {
          assetId: asset.id,
          priceDate,
          price: quote.price.toString(),
          currency: "USD",
          source: SOURCE,
          isEstimated: false,
        },
      });

      updated += 1;
    } catch (error) {
      failures.push(
        `${ticker}: ${
          error instanceof Error
            ? error.message
            : "quote failed"
        }`,
      );
    }
  }

  console.log(
  "[INVESTMENT PRICE REFRESH] Results:",
  {
    attempted: assets.length,
    updated,
    failures,
  },
);

  return {
    attempted: assets.length,
    updated,
    failures,
  };
}
