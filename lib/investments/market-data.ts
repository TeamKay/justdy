import prisma from "@/lib/prisma";

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

type MarketPrice = {
  symbol: string;
  price: number;
  asOf: Date;
  source: string;
};

type FxRate = {
  base: "USD" | "GHS";
  quote: "USD" | "GHS";
  rate: number;
  asOf: Date;
  source: string;
};

type Provider = {
  name: string;
  getPrices(symbols: string[]): Promise<MarketPrice[]>;
  getFx(
    base: "USD" | "GHS",
    quote: "USD" | "GHS",
  ): Promise<FxRate | null>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function requireTwelveDataKey() {
  const key = process.env.TWELVE_DATA_API_KEY;

  if (!key) {
    throw new Error("TWELVE_DATA_API_KEY is not configured.");
  }

  return key;
}

async function twelve(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const key = requireTwelveDataKey();
  const url = new URL(`${TWELVE_DATA_BASE}${path}`);

  for (const [keyName, value] of Object.entries({
    ...params,
    apikey: key,
  })) {
    url.searchParams.set(keyName, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(body) ? getString(body.message) : null;

    throw new Error(
      message || `Market-data request failed (${response.status}).`,
    );
  }

  if (
    isRecord(body) &&
    body.status === "error"
  ) {
    throw new Error(
      getString(body.message) ||
        "Market-data provider returned an error.",
    );
  }

  return body;
}

const twelveData: Provider = {
  name: "TWELVE_DATA",

  async getPrices(symbols) {
    if (!symbols.length) {
      return [];
    }

    const body = await twelve("/price", {
      symbol: symbols.join(","),
    });

    let rows: Array<[string, Record<string, unknown>]> = [];

    if (Array.isArray(body)) {
      rows = body
        .filter(isRecord)
        .map((row) => [String(row.symbol ?? ""), row]);
    } else if (isRecord(body)) {
      if (body.price != null) {
        rows = [
          [
            String(body.symbol ?? symbols[0] ?? ""),
            body,
          ],
        ];
      } else {
        rows = Object.entries(body).flatMap(([key, row]) => {
          if (
            key === "status" ||
            key === "message" ||
            !isRecord(row)
          ) {
            return [];
          }

          return [[key, row]];
        });
      }
    }

    return rows.flatMap(([key, row]) => {
      const rawPrice = row.price ?? row.close;
      const price = Number(rawPrice);

      if (!Number.isFinite(price) || price < 0) {
        return [];
      }

      return [
        {
          symbol: key || String(row.symbol ?? ""),
          price,
          asOf: new Date(),
          source: "TWELVE_DATA",
        },
      ];
    });
  },

  async getFx(base, quote) {
    const body = await twelve("/exchange_rate", {
      symbol: `${base}/${quote}`,
      dp: "8",
    });

    if (!isRecord(body)) {
      return null;
    }

    const rate = Number(body.rate);

    if (!Number.isFinite(rate) || rate <= 0) {
      return null;
    }

    const timestamp = Number(body.timestamp);

    return {
      base,
      quote,
      rate,
      asOf:
        Number.isFinite(timestamp) && timestamp > 0
          ? new Date(timestamp * 1000)
          : new Date(),
      source: "TWELVE_DATA",
    };
  },
};

function provider(): Provider {
  const configured = (
    process.env.MARKET_DATA_PROVIDER || "twelvedata"
  ).toLowerCase();

  if (configured === "twelvedata") {
    return twelveData;
  }

  throw new Error(
    `Unsupported MARKET_DATA_PROVIDER: ${configured}`,
  );
}

export async function refreshMarketData(userId: string) {
  const activeProvider = provider();

  const assets = await prisma.investmentAsset.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      tickerOrSymbol: true,
      marketDataSymbol: true,
      marketDataProvider: true,
      currency: true,
    },
  });

  const providerAssets = assets.filter((asset) => {
    const selected = asset.marketDataProvider?.trim().toUpperCase();

    return (
      Boolean(
        asset.marketDataSymbol ||
          asset.symbol ||
          asset.tickerOrSymbol,
      ) &&
      (!selected || selected === activeProvider.name)
    );
  });

  const symbols = providerAssets
    .map(
      (asset) =>
        asset.marketDataSymbol ||
        asset.symbol ||
        asset.tickerOrSymbol,
    )
    .filter(
      (value): value is string => Boolean(value),
    );

  const prices = await activeProvider.getPrices([
    ...new Set(symbols),
  ]);

  const bySymbol = new Map(
    prices.map((price) => [
      price.symbol.toUpperCase(),
      price,
    ]),
  );

  let updatedPrices = 0;

  for (const asset of providerAssets) {
    const symbol = (
      asset.marketDataSymbol ||
      asset.symbol ||
      asset.tickerOrSymbol ||
      ""
    ).toUpperCase();

    const price = bySymbol.get(symbol);

    if (!price) {
      continue;
    }

    await prisma.investmentPrice.upsert({
      where: {
        assetId_asOf: {
          assetId: asset.id,
          asOf: price.asOf,
        },
      },
      create: {
        userId,
        assetId: asset.id,
        price: price.price.toString(),
        currency: asset.currency,
        asOf: price.asOf,
        source: price.source,
        isRealtime: true,
      },
      update: {
        price: price.price.toString(),
        currency: asset.currency,
        source: price.source,
        isRealtime: true,
      },
    });

    updatedPrices += 1;
  }

  const fx = await activeProvider.getFx("USD", "GHS");

  if (fx) {
    await prisma.investmentFXRate.upsert({
      where: {
        userId_base_quote_asOf: {
          userId,
          base: fx.base,
          quote: fx.quote,
          asOf: fx.asOf,
        },
      },
      create: {
        userId,
        base: fx.base,
        quote: fx.quote,
        rate: fx.rate.toString(),
        asOf: fx.asOf,
        source: fx.source,
      },
      update: {
        rate: fx.rate.toString(),
        source: fx.source,
      },
    });
  }

  return {
    provider: activeProvider.name,
    assetsConsidered: providerAssets.length,
    updatedPrices,
    fxUpdated: Boolean(fx),
  };
}
