import "server-only";

import prisma from "@/lib/prisma";

type Currency = "USD" | "GHS";
type TxType =
  | "CONTRIBUTION"
  | "DEPOSIT"
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "INTEREST"
  | "FEE"
  | "WITHDRAWAL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "MATURITY"
  | "REINVESTMENT"
  | "ADJUSTMENT";

const CASH_SIGNS: Partial<Record<TxType, number>> = {
  CONTRIBUTION: 1,
  DEPOSIT: 1,
  BUY: -1,
  SELL: 1,
  DIVIDEND: 1,
  INTEREST: 1,
  FEE: -1,
  WITHDRAWAL: -1,
  TRANSFER_IN: 1,
  TRANSFER_OUT: -1,
  MATURITY: 1,
  REINVESTMENT: -1,
};

const EXTERNAL_FLOW_SIGNS: Partial<Record<TxType, number>> = {
  CONTRIBUTION: 1,
  DEPOSIT: 1,
  WITHDRAWAL: -1,
};

const numberOf = (value: unknown) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

function convertCurrency(
  amount: number,
  currency: Currency,
  baseCurrency: Currency,
  rates: Map<string, number>,
) {
  if (currency === baseCurrency) return { value: amount, missing: false };

  const direct = rates.get(`${currency}:${baseCurrency}`);
  if (direct && direct > 0) return { value: amount * direct, missing: false };

  const inverse = rates.get(`${baseCurrency}:${currency}`);
  if (inverse && inverse > 0) return { value: amount / inverse, missing: false };

  return { value: 0, missing: true };
}

function convertCurrencyAtDate(
  amount: number,
  currency: Currency,
  baseCurrency: Currency,
  history: Map<string, { date: Date; rate: number }[]>,
  transactionDate: Date,
) {
  if (currency === baseCurrency) {
    return { value: amount, missing: false };
  }

  const findRate = (key: string) =>
    (history.get(key) ?? []).find(
      (item) => item.date.getTime() <= transactionDate.getTime(),
    )?.rate;

  const direct = findRate(`${currency}:${baseCurrency}`);

  if (direct && direct > 0) {
    return { value: amount * direct, missing: false };
  }

  const inverse = findRate(`${baseCurrency}:${currency}`);

  if (inverse && inverse > 0) {
    return { value: amount / inverse, missing: false };
  }

  return { value: 0, missing: true };
}

export async function calculatePortfolioValuation(
  profileId: string,
  baseCurrency: Currency,
) {
  const today = startOfUtcDay(new Date());

  const [accounts, assets, exchangeRates, snapshots] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: { profileId, isActive: true },
      select: {
        id: true,
        name: true,
        currency: true,
        type: true,
        transactions: {
          orderBy: { occurredAt: "asc" },
          select: {
            type: true,
            occurredAt: true,
            currency: true,
            amount: true,
            quantity: true,
            unitPrice: true,
            fees: true,
          },
        },
      },
    }),
    prisma.investmentAsset.findMany({
      where: { profileId, isActive: true },
      select: {
        id: true,
        name: true,
        symbol: true,
        assetType: true,
        currency: true,
        prices: {
          where: { priceDate: { lte: today } },
          orderBy: { priceDate: "desc" },
          take: 1,
          select: { price: true, currency: true, priceDate: true, source: true },
        },
       treasuryBill: {
        select: {
          purchaseDate: true,
          maturityDate: true,
          purchasePrice: true,
          faceValue: true,
          actualProceeds: true,
          status: true,
        },
      },
      },
    }),
   prisma.investmentExchangeRate.findMany({
  where: { rateDate: { lte: today } },
  orderBy: { rateDate: "desc" },
  select: {
    baseCurrency: true,
    quoteCurrency: true,
    rate: true,
    rateDate: true,
  },
}),
    prisma.investmentPortfolioSnapshot.findMany({
      where: { profileId, baseCurrency },
      orderBy: { snapshotDate: "desc" },
      take: 365,
      select: { snapshotDate: true, totalValue: true, metadata: true },
    }),
  ]);

  const rates = new Map<string, number>();
const rateDates = new Map<string, Date>();

const rateHistory = new Map<
  string,
  { date: Date; rate: number }[]
>();

for (const item of exchangeRates) {
  const key = `${item.baseCurrency}:${item.quoteCurrency}`;
  const rate = numberOf(item.rate);

  if (!rateHistory.has(key)) {
    rateHistory.set(key, []);
  }

  rateHistory.get(key)!.push({
    date: item.rateDate,
    rate,
  });

  if (!rates.has(key)) {
    rates.set(key, rate);
    rateDates.set(key, item.rateDate);
  }
}

const positions = new Map<
  string,
  {
    quantity: number;
    averageCost: number;
    realizedGainLoss: number;
    assetCurrency: Currency;
    costBasisKnown: boolean;
  }
>();

const realizedGainLossByCurrency = new Map<Currency, number>();
const unrealizedGainLossByCurrency = new Map<Currency, number>();
const investmentIncomeByCurrency = new Map<Currency, number>();
  const cashByCurrency = new Map<Currency, number>();
  const externalFlows: { date: Date; amount: number; currency: Currency }[] = [];

  for (const account of accounts) {
    for (const tx of account.transactions) {
      const type = tx.type as TxType;
      const amount = numberOf(tx.amount);
      const fees = numberOf(tx.fees);
      const currency = tx.currency as Currency;
      const cashSign = CASH_SIGNS[type];

      if (cashSign !== undefined) {
       const cashDelta = cashSign * amount +
        (type === "BUY" || type === "FEE" || type === "REINVESTMENT"
          ? -fees
          : 0);
        cashByCurrency.set(
          currency,
          (cashByCurrency.get(currency) ?? 0) + cashDelta,
        );
      }

      if (type === "DIVIDEND" || type === "INTEREST") {
        investmentIncomeByCurrency.set(
          currency,
          (investmentIncomeByCurrency.get(currency) ?? 0) + amount,
        );
      }

      const externalSign = EXTERNAL_FLOW_SIGNS[type];
      if (externalSign !== undefined) {
        externalFlows.push({
          date: tx.occurredAt,
          amount: externalSign * amount,
          currency,
        });
      }

    }
  }

  // Build long-only positions from all transactions linked to each asset.
  const transactionsByAsset = await prisma.investmentTransaction.findMany({
    where: {
      account: { is: { profileId, isActive: true } },
      assetId: { not: null },
      type: { in: ["BUY", "SELL", "REINVESTMENT", "TRANSFER_IN"] },
    },
    orderBy: [
  { occurredAt: "asc" },
  { createdAt: "asc" },
],
    select: {
    assetId: true,
    type: true,
    amount: true,
    quantity: true,
    unitPrice: true,
    fees: true,
    currency: true,
    occurredAt: true,
  },
    });

for (const tx of transactionsByAsset) {
  if (!tx.assetId) continue;

  const quantity =
    numberOf(tx.quantity) ||
    (numberOf(tx.unitPrice) > 0
      ? numberOf(tx.amount) / numberOf(tx.unitPrice)
      : 0);

  if (quantity <= 0) continue;

  const currency = tx.currency as Currency;

    const current = positions.get(tx.assetId) ?? {
    quantity: 0,
    averageCost: 0,
    realizedGainLoss: 0,
    assetCurrency: currency,
    costBasisKnown: true,
  };

  const unitPrice =
    numberOf(tx.unitPrice) > 0
      ? numberOf(tx.unitPrice)
      : numberOf(tx.amount) / quantity;

  const amount = numberOf(tx.amount);
  const fees = numberOf(tx.fees);

  if (tx.type === "BUY" || tx.type === "REINVESTMENT") {
    const addedCost = amount + fees;
    const nextQuantity = current.quantity + quantity;

    if (current.costBasisKnown) {
      current.averageCost =
        nextQuantity > 0
          ? (
              current.averageCost * current.quantity +
              (addedCost > 0 ? addedCost : unitPrice * quantity)
            ) / nextQuantity
          : 0;
    }

    current.quantity = nextQuantity;
  } else if (tx.type === "TRANSFER_IN") {
    current.quantity += quantity;
    current.averageCost = 0;
    current.costBasisKnown = false;
  } else if (tx.type === "SELL") {
    const quantityBeforeSale = current.quantity;
    const quantitySold = Math.min(quantity, quantityBeforeSale);

    if (quantitySold > 0) {
      if (current.costBasisKnown) {
        const saleProceeds = amount;
        const costOfSoldShares =
          current.averageCost * quantitySold;
        const realizedGainLoss =
          saleProceeds - costOfSoldShares;

        current.realizedGainLoss += realizedGainLoss;

        realizedGainLossByCurrency.set(
          currency,
          (realizedGainLossByCurrency.get(currency) ?? 0) +
            realizedGainLoss,
        );
      }

      current.quantity = Math.max(
        0,
        quantityBeforeSale - quantitySold,
      );

      if (current.quantity === 0) {
        current.averageCost = 0;
        current.costBasisKnown = true;
      }
    }
  }

  positions.set(tx.assetId, current);
}

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const holdings: {
    id: string;
    name: string;
    symbol: string | null;
    quantity: number;
    averageCost: number | null;
    unrealizedGainLoss: number | null;
    price: number | null;
    value: number | null;
    currency: Currency;
    priceSource: string;
    priceDate: Date | null;
    estimated: boolean;
    
  }[] = [];
  const unpricedAssets: string[] = [];
  const stalePrices: string[] = [];
  const rawValues = new Map<Currency, number>();
  let estimatedHoldingCount = 0;

  for (const [assetId, position] of positions) {
    if (position.quantity <= 0) continue;
    const asset = assetMap.get(assetId);
    if (
      !asset ||
      asset.assetType === "CASH" ||
      (asset.assetType === "TREASURY_BILL" && asset.treasuryBill)
    ) continue;

    const latestPrice = asset.prices[0];
   const fallbackPrice =
  position.costBasisKnown && position.averageCost > 0
    ? position.averageCost
    : null;
    const price = latestPrice ? numberOf(latestPrice.price) : fallbackPrice;
    const currency = (latestPrice?.currency ?? asset.currency) as Currency;

    if (price === null || price <= 0) {
      unpricedAssets.push(asset.name);
      holdings.push({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        quantity: position.quantity,
        price: null,
        value: null,
        currency,
        priceSource: "Missing price and cost basis",
        priceDate: null,
        estimated: true,
        averageCost: position.averageCost,
        unrealizedGainLoss: null,
       
      });
      continue;
    }

       const value = position.quantity * price;
    const unrealizedGainLoss = position.costBasisKnown
      ? (price - position.averageCost) * position.quantity
      : null;

    if (unrealizedGainLoss !== null) {
      unrealizedGainLossByCurrency.set(
        currency,
        (unrealizedGainLossByCurrency.get(currency) ?? 0) +
          unrealizedGainLoss,
      );
    }
    rawValues.set(currency, (rawValues.get(currency) ?? 0) + value);
    const estimated = !latestPrice;
    if (estimated) estimatedHoldingCount += 1;
    if (latestPrice && today.getTime() - latestPrice.priceDate.getTime() > 7 * 86400000) {
      stalePrices.push(asset.name);
    }

    holdings.push({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      quantity: position.quantity,
      price,
      value,
      currency,
      priceSource: latestPrice ? latestPrice.source : "Estimated at average purchase cost",
      priceDate: latestPrice?.priceDate ?? null,
      estimated,
      averageCost: position.averageCost,
      unrealizedGainLoss,
    });
  }

    // Record realized gains from redeemed Treasury bills.
  for (const asset of assets) {
    const bill = asset.treasuryBill;

    if (
      !bill ||
      bill.status !== "REDEEMED" ||
      bill.actualProceeds === null
    ) {
      continue;
    }

    const position = positions.get(asset.id);
    const costBasis =
      position?.averageCost ?? numberOf(bill.purchasePrice);

    const realizedGainLoss =
      numberOf(bill.actualProceeds) - costBasis;

    const currency = asset.currency as Currency;

    realizedGainLossByCurrency.set(
      currency,
      (realizedGainLossByCurrency.get(currency) ?? 0) +
        realizedGainLoss,
    );
  }
  // Treasury bills are valued by straight-line accretion from purchase price
  // to face value. This is an estimate, not a market quote.
  for (const asset of assets) {
    const bill = asset.treasuryBill;
    if (!bill || !["ACTIVE", "MATURED"].includes(bill.status)) continue;

    const purchasePrice = numberOf(bill.purchasePrice);
    const faceValue = numberOf(bill.faceValue);
    const totalDays = Math.max(
      1,
      (bill.maturityDate.getTime() - bill.purchaseDate.getTime()) / 86400000,
    );
    const elapsedDays = Math.max(
      0,
      Math.min(totalDays, (today.getTime() - bill.purchaseDate.getTime()) / 86400000),
    );
    const value = bill.status === "MATURED" || today >= bill.maturityDate
  ? faceValue
  : purchasePrice + (faceValue - purchasePrice) * (elapsedDays / totalDays);

const currency = asset.currency as Currency;

// Track the estimated unrealized gain on this Treasury bill.
unrealizedGainLossByCurrency.set(
  currency,
  (unrealizedGainLossByCurrency.get(currency) ?? 0) +
    (value - purchasePrice),
);

rawValues.set(currency, (rawValues.get(currency) ?? 0) + value);
    estimatedHoldingCount += 1;
    holdings.push({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      quantity: 1,
      price: value,
      value,
      currency,
      priceSource: "Estimated straight-line treasury-bill accrual",
      priceDate: today,
      estimated: true,
      averageCost: purchasePrice,
      unrealizedGainLoss: value - purchasePrice,
    });
  }

  for (const [currency, cash] of cashByCurrency) {
    rawValues.set(currency, (rawValues.get(currency) ?? 0) + cash);
  }
  

  let totalValue = 0;
  const missingFxCurrencies = new Set<Currency>();
  const currencyValues: Record<Currency, number> = { USD: 0, GHS: 0 };

  for (const [currency, amount] of rawValues) {
  currencyValues[currency] += amount;
  

  const converted = convertCurrency(
    amount,
    currency,
    baseCurrency,
    rates,
  );

  if (converted.missing) {
    missingFxCurrencies.add(currency);
  } else {
    totalValue += converted.value;
  }
}


  const latestSnapshot = snapshots[0] ?? null;
  const priorSnapshot = snapshots[1] ?? null;
  let dailyChange: number | null = null;
  let dailyChangePercent: number | null = null;
  let dailyChangeNote = "Capture a portfolio snapshot to establish a daily baseline.";

  if (latestSnapshot) {
    const snapshotDay = startOfUtcDay(latestSnapshot.snapshotDate);
    const yesterday = new Date(today.getTime() - 86400000);
    if (snapshotDay.getTime() === yesterday.getTime()) {
      const metadata = latestSnapshot.metadata as
        | { capturedAt?: string }
        | null;
      const capturedAt = metadata?.capturedAt
        ? new Date(metadata.capturedAt)
        : new Date(snapshotDay.getTime() + 86400000);
      const flows = externalFlows.filter((flow) => flow.date > capturedAt);
      let convertedFlows = 0;
      let flowFxMissing = false;
      for (const flow of flows) {
  const converted = convertCurrencyAtDate(
    flow.amount,
    flow.currency,
    baseCurrency,
    rateHistory,
    flow.date,
  );
  

  if (converted.missing) {
    flowFxMissing = true;
  } else {
    convertedFlows += converted.value;
  }
}
      if (!flowFxMissing && missingFxCurrencies.size === 0) {
       dailyChange = totalValue - numberOf(latestSnapshot.totalValue) - convertedFlows;

const previousValue = numberOf(latestSnapshot.totalValue);

dailyChangePercent =
  previousValue > 0 ? (dailyChange / previousValue) * 100 : null;

dailyChangeNote =
  "Change since the previous day's snapshot, adjusted for external cash flows.";
      } else {
        dailyChangeNote = "Daily change is unavailable because an exchange rate is missing.";
      }
    } else {
      dailyChangeNote = "Capture snapshots on consecutive days to calculate daily performance.";
    }
  }

  const chartSnapshots = [...snapshots].reverse().map((snapshot) => ({
    date: snapshot.snapshotDate.toISOString(),
    value: numberOf(snapshot.totalValue),
  }));

  const fxStaleCurrencies = new Set<Currency>();
  for (const currency of ["USD", "GHS"] as const) {
    if (currency === baseCurrency) continue;
    const date = rateDates.get(`${currency}:${baseCurrency}`) ?? rateDates.get(`${baseCurrency}:${currency}`);
    if (date && today.getTime() - date.getTime() > 7 * 86400000) {
      fxStaleCurrencies.add(currency);
    }
  }
  
    const convertGainLossMap = (
    values: Map<Currency, number>,
  ): number | null => {
    let total = 0;

    for (const [currency, amount] of values) {
      const converted = convertCurrency(
        amount,
        currency,
        baseCurrency,
        rates,
      );

      if (converted.missing) return null;

      total += converted.value;
    }

    return total;
  };

  const realizedGainLoss = convertGainLossMap(realizedGainLossByCurrency);
  const unrealizedGainLoss = convertGainLossMap(unrealizedGainLossByCurrency);

  const investmentIncome = convertGainLossMap(investmentIncomeByCurrency);

const totalInvestmentReturn =
  realizedGainLoss !== null &&
  unrealizedGainLoss !== null &&
  investmentIncome !== null
    ? realizedGainLoss + unrealizedGainLoss + investmentIncome
    : null;

  const totalGainLoss =
    realizedGainLoss !== null && unrealizedGainLoss !== null
      ? realizedGainLoss + unrealizedGainLoss
      : null;

  return {
    baseCurrency,
    totalValue,
    currencyValues,
    cashByCurrency: Object.fromEntries(cashByCurrency),
    holdings,
    unpricedAssets,
    realizedGainLoss,
    unrealizedGainLoss,
    totalGainLoss,
        investmentIncome,
    totalInvestmentReturn,
    externalFlows,
    stalePrices,
    missingFxCurrencies: [...missingFxCurrencies],
    staleFxCurrencies: [...fxStaleCurrencies],
    estimatedHoldingCount,
   dailyChange,
dailyChangePercent,
dailyChangeNote,
    snapshots: chartSnapshots,
    latestSnapshotDate: latestSnapshot?.snapshotDate ?? null,
    priorSnapshotDate: priorSnapshot?.snapshotDate ?? null,
    capturedAt: new Date().toISOString(),
  };
}

