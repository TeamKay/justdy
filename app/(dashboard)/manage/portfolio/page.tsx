"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

import {
  Plus,
  DollarSign,
  X,
  Briefcase,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  History,
  Layers,
  AlertCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

// --- PRISMA TYPE IMPORTS ---
import {
  AssetType,
  RegionType,
  CurrencyType,
  InvestmentTransactionType,
  StatusType,
} from "@/lib/generated/prisma/enums";

import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from "@/app/actions/investments";

const toLocalDateString = (date: Date | string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export interface Investment {
  id: string;
  name: string;
  tickerOrSymbol?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  type: InvestmentTransactionType;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  exchangeRate: number;
  amountUSD: number;
  date: string;
  status: StatusType;
  notes?: string | null;
  cusip?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  source?: string | null;
  sourceFile?: string | null;
  settlementDate?: string | null;
  costBasis?: number | null;
  marketValue?: number | null;
  unrealizedGain?: number | null;
  unrealizedGainPercent?: number | null;
}

export interface PositionSnapshot {
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  accountNumber?: string;
  accountName?: string;
  statementDate?: string;
  quantity?: number;
}

export interface CumulativeHolding {
  key: string;
  name: string;
  tickerOrSymbol?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;

  totalShares: number;

  // Current remaining cost basis
  totalContributed: number;
  totalContributedUSD: number;

  avgPricePerShare: number;
  currentPricePerShare?: number;

  currentValueUSD: number;
  currentValueGHS: number;

  unrealizedGainUSD: number;
  unrealizedGainGHS: number;

  returnPercentage: number;
  weightPercentage: number;

  // Actual realized P/L from SELL transactions
  realizedGainUSD: number;
  realizedGainGHS: number;

  // Dividend income, including DRIP dividends
  dividendIncomeUSD: number;
  dividendIncomeGHS: number;

  // Useful accounting metrics
  totalInvestedUSD: number;
  totalInvestedGHS: number;
  totalSaleProceedsUSD: number;
  totalSaleProceedsGHS: number;

  transactions: Investment[];
}

function normalizeInvestmentFromDatabase(
  investment: Omit<Investment, "date" | "settlementDate"> & {
    date: string | Date;
    settlementDate?: string | Date | null;
  },
): Investment {
  return {
    ...investment,
    date:
      typeof investment.date === "string"
        ? investment.date
        : investment.date.toISOString(),
    settlementDate:
      investment.settlementDate == null
        ? null
        : typeof investment.settlementDate === "string"
          ? investment.settlementDate
          : investment.settlementDate.toISOString(),
  };
}

function parsePositionSnapshot(notes?: string | null): PositionSnapshot | null {
  if (!notes?.startsWith("FIDELITY_POSITION_SNAPSHOT|")) return null;

  const values: Record<string, string> = {};
  for (const part of notes.split("|").slice(1)) {
    const separator = part.indexOf("=");
    if (separator > 0) {
      values[part.slice(0, separator)] = part.slice(separator + 1);
    }
  }

  const costBasis = Number(values.costBasis);
  const marketValue = Number(values.marketValue);
  const unrealizedGain = Number(values.unrealizedGain);
  const unrealizedGainPercent = Number(values.unrealizedGainPercent);
  const quantity = Number(values.quantity);

  if (
    ![costBasis, marketValue, unrealizedGain, unrealizedGainPercent].every(
      Number.isFinite,
    )
  ) {
    return null;
  }

  return {
    costBasis,
    marketValue,
    unrealizedGain,
    unrealizedGainPercent,
    accountNumber: values.accountNumber || undefined,
    accountName: values.accountName || undefined,
    statementDate: values.statementDate || undefined,
    quantity: Number.isFinite(quantity) ? quantity : undefined,
  };
}

function isPositionSnapshot(investment: Investment): boolean {
  return parsePositionSnapshot(investment.notes) !== null;
}

const PALETTE = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
];

// Fidelity may expose a CUSIP instead of a ticker. Never send a CUSIP
// to the live market-price API.
const CUSIP_TO_SYMBOL: Record<string, string> = {
  "46138G649": "QQQM",
  "922908363": "VOO",
  "808524797": "SCHD",
  "921909768": "VXUS",
  "921909818": "VTIAX",
  "922908710": "VFIAX",
};

function looksLikeCusip(value: string): boolean {
  return /^[A-Z0-9]{9}$/.test(value.trim().toUpperCase());
}

function resolveInvestmentSymbol(
  symbol: string | null | undefined,
  name?: string | null,
): string {
  const direct = (symbol ?? "").trim().toUpperCase();

  if (direct && CUSIP_TO_SYMBOL[direct]) {
    return CUSIP_TO_SYMBOL[direct];
  }

  if (direct && !looksLikeCusip(direct)) {
    return direct;
  }

  const tickerInName = (name ?? "").match(/\(([A-Z][A-Z0-9.-]{1,9})\)/);

  return tickerInName?.[1]?.toUpperCase() ?? "";
}

// Unified Finance API Helper
async function fetchMarketPrice(
  symbol: string,
  region?: RegionType,
): Promise<number | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  let proxyUrl = `/api/finance?symbol=${encodeURIComponent(cleanSymbol)}`;
  if (region) {
    proxyUrl += `&region=${encodeURIComponent(region)}`;
  }

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (result) {
      const price =
        result.meta?.regularMarketPrice ?? result.meta?.chartPreviousClose;
      return typeof price === "number" ? price : null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ticker "${cleanSymbol}":`, error);
    return null;
  }
}

interface Lot {
  shares: number;
  costPerShare: number;
  totalCost: number;
}

interface LedgerResult {
  shares: number;
  costBasis: number;

  invested: number;
  saleProceeds: number;
  realizedGain: number;
  dividends: number;

  lots: Lot[];
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTicker(inv: Investment): string {
  return resolveInvestmentSymbol(inv.tickerOrSymbol, inv.name)
    .trim()
    .toUpperCase();
}

function fidelityActivityFromNotes(inv: Investment): string {
  const match = inv.notes?.match(/(?:^|\|)FIDELITY_ACTIVITY=([^|]*)/i);
  if (match?.[1]) return match[1].trim().toUpperCase();

  const actionMatch = inv.notes?.match(/(?:^|\|)FIDELITY_ACTION=([^|]*)/i);
  if (actionMatch?.[1]) {
    const action = actionMatch[1].trim().toUpperCase();
    if (/SELL|SOLD|SALE|DISPOSAL/.test(action)) return "SELL";
    if (/REINVESTMENT|DRIP/.test(action)) return "DRIP";
    if (/DIVIDEND/.test(action)) return "DIVIDEND";
    if (/INTEREST/.test(action)) return "INTEREST";
    if (/CONTRIBUTION/.test(action)) return "CONTRIBUTION";
    if (/TRANSFER.*RECEIVED|TRANSFER_IN|ELECTRONIC FUNDS TRANSFER/.test(action))
      return "TRANSFER_IN";
    if (/WITHDRAWAL|TRANSFER.*OUT/.test(action)) return "TRANSFER_OUT";
    if (/FEE|COMMISSION/.test(action)) return "FEE";
    if (/TAX/.test(action)) return "TAX";
    if (/BUY|BOUGHT|PURCHASE/.test(action)) return "BUY";
  }

  return String(inv.type).toUpperCase();
}

function isDividendTransaction(inv: Investment): boolean {
  return (
    fidelityActivityFromNotes(inv) === "DIVIDEND" ||
    String(inv.type).toUpperCase() === "DIVIDEND"
  );
}

function isDripTransaction(inv: Investment): boolean {
  return (
    fidelityActivityFromNotes(inv) === "DRIP" ||
    inv.type === InvestmentTransactionType.DRIP
  );
}

function calculateTransactionLedger(transactions: Investment[]): LedgerResult {
  const lots: Lot[] = [];

  let invested = 0;
  let saleProceeds = 0;
  let realizedGain = 0;
  let dividends = 0;

  // IMPORTANT:
  // Fidelity records must be processed chronologically.
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const tx of sorted) {
    const shares = Math.abs(safeNumber(tx.shares));
    const amount = Math.abs(safeNumber(tx.amount));

    const price =
      safeNumber(tx.pricePerShare) > 0
        ? Math.abs(safeNumber(tx.pricePerShare))
        : shares > 0
          ? amount / shares
          : 0;

    const type = fidelityActivityFromNotes(tx);

    // --------------------------------------------------
    // BUY
    // --------------------------------------------------
    if (type === String(InvestmentTransactionType.BUY)) {
      if (shares <= 0 || amount <= 0) continue;

      lots.push({
        shares,
        costPerShare: price || amount / shares,
        totalCost: amount,
      });

      invested += amount;
      continue;
    }

    // --------------------------------------------------
    // DRIP
    //
    // Dividend is received and immediately reinvested.
    // Therefore:
    //   dividend income += amount
    //   shares += quantity
    //   cost basis += amount
    // --------------------------------------------------
    if (isDripTransaction(tx)) {
      dividends += amount;

      if (shares > 0 && amount > 0) {
        lots.push({
          shares,
          costPerShare: price || amount / shares,
          totalCost: amount,
        });
      }

      continue;
    }

    // --------------------------------------------------
    // CASH / DIVIDEND
    // --------------------------------------------------
    if (isDividendTransaction(tx)) {
      dividends += amount;
      continue;
    }

    // --------------------------------------------------
    // SELL
    //
    // Use FIFO:
    // oldest shares are sold first.
    // --------------------------------------------------
    if (type === String(InvestmentTransactionType.SELL)) {
      if (shares <= 0) continue;

      let sharesRemaining = shares;
      let costOfSharesSold = 0;

      while (sharesRemaining > 0 && lots.length > 0) {
        const lot = lots[0];

        const sharesFromLot = Math.min(sharesRemaining, lot.shares);

        const costFromLot = sharesFromLot * lot.costPerShare;

        costOfSharesSold += costFromLot;

        lot.shares -= sharesFromLot;
        lot.totalCost -= costFromLot;

        sharesRemaining -= sharesFromLot;

        if (lot.shares <= 0.00000001) {
          lots.shift();
        }
      }

      // Proceeds from the sale
      const proceeds = amount;

      saleProceeds += proceeds;

      // Actual realized gain
      realizedGain += proceeds - costOfSharesSold;

      continue;
    }
  }

  const shares = lots.reduce((sum, lot) => sum + lot.shares, 0);

  const costBasis = lots.reduce((sum, lot) => sum + lot.totalCost, 0);

  return {
    shares,
    costBasis,
    invested,
    saleProceeds,
    realizedGain,
    dividends,
    lots,
  };
}

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365.25;

function calculateYearsElapsed(
  oldestDate: number,
  currentDate: number,
): number {
  return Math.max((currentDate - oldestDate) / YEAR_IN_MS, 0.01);
}

export default function PortfolioTracker() {
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [regionFilter, setRegionFilter] = useState<"USA" | "GHANA">("USA");
  const [currentDate] = useState(() => Date.now());
  const [selectedHoldingKey, setSelectedHoldingKey] = useState<string | null>(
    null,
  );

  // --- LIVE MARKET PRICES STATE ---
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // --- REFRESH DATABASE DATA ---
  const fetchDbData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInvestments();
      if (res.success && res.data) {
        const formatted: Investment[] = res.data.map((item) =>
          normalizeInvestmentFromDatabase({
            ...item,
            date: item.date,
            settlementDate: item.settlementDate,
          }),
        );
        setInvestments(formatted);
      } else {
        setError(res.error || "Failed to load investments.");
      }
    } catch {
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) await fetchDbData();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchDbData]);

  // Extract unique ticker items
  const uniqueHoldingItems = useMemo(() => {
    const map = new Map<string, { ticker: string; region: RegionType }>();
    investments.forEach((inv) => {
      const ticker = resolveInvestmentSymbol(inv.tickerOrSymbol, inv.name);
      if (ticker) {
        map.set(ticker, { ticker, region: inv.region });
      }
    });
    return Array.from(map.values());
  }, [investments]);

  // --- FETCH REAL-TIME MARKET PRICES ---
  const fetchMarketPrices = useCallback(
    async (items: { ticker: string; region: RegionType }[]) => {
      if (items.length === 0) return;

      try {
        const priceResults = await Promise.all(
          items.map(async ({ ticker, region }) => {
            const price = await fetchMarketPrice(ticker, region);
            return { ticker, price };
          }),
        );

        const updatedPrices: Record<string, number> = {};
        priceResults.forEach(({ ticker, price }) => {
          if (price !== null) {
            updatedPrices[ticker] = price;
          }
        });

        setLivePrices((prev) => ({ ...prev, ...updatedPrices }));
        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        console.error("Error fetching market prices");
      }
    },
    [],
  );

  useEffect(() => {
    let ignore = false;
    if (uniqueHoldingItems.length > 0) {
      Promise.resolve().then(async () => {
        if (ignore) return;
        setIsLoadingPrices(true);
        try {
          await fetchMarketPrices(uniqueHoldingItems);
        } finally {
          if (!ignore) setIsLoadingPrices(false);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [uniqueHoldingItems, fetchMarketPrices]);

  const handleFullRefresh = async () => {
    await fetchDbData();
    if (uniqueHoldingItems.length > 0) {
      setIsLoadingPrices(true);
      await fetchMarketPrices(uniqueHoldingItems);
    }
  };

  // --- FILTERED RAW DATA ---
  const filteredInvestments = useMemo(
    () => investments.filter((i) => i.region === regionFilter),
    [investments, regionFilter],
  );

  const regionLabel =
    regionFilter === "GHANA" ? "Ghana Investments" : "US Investments";
  const regionCurrencyLabel =
    regionFilter === "GHANA" ? "Ghanaian Cedi (GHS)" : "US Dollar (USD)";

  // --- CUMULATIVE HOLDINGS CALCULATION ---
  // ------------------------------------------------------------
  // TRUE PORTFOLIO LEDGER
  //
  // IMPORTANT:
  // Position snapshots are NOT transactions.
  // They are only used as a fallback when transaction history
  // is incomplete.
  //
  // Multiple Fidelity snapshots must NEVER be added together.
  // ------------------------------------------------------------
  const cumulativeHoldings = useMemo(() => {
    const accountHoldings = new Map<string, CumulativeHolding>();

    // Current Fidelity Positions are the authority for CURRENT HOLDINGS
    // whenever a Positions snapshot exists for an account. Accounts History
    // remains the authority for historical activity, realized gains,
    // dividends, contributions and other cash-flow events.
    const snapshotRows = filteredInvestments.filter(isPositionSnapshot);

    const latestSnapshotDateByAccount = new Map<string, number>();

    for (const inv of snapshotRows) {
      const snapshot = parsePositionSnapshot(inv.notes);
      if (!snapshot) continue;

      const accountKey = (
        inv.accountNumber ||
        snapshot.accountNumber ||
        inv.accountName ||
        snapshot.accountName ||
        "NO_ACCOUNT"
      )
        .trim()
        .toUpperCase();

      const dateValue = new Date(snapshot.statementDate || inv.date).getTime();

      if (!Number.isFinite(dateValue)) continue;

      const previous = latestSnapshotDateByAccount.get(accountKey) ?? 0;
      if (dateValue > previous) {
        latestSnapshotDateByAccount.set(accountKey, dateValue);
      }
    }

    const latestSnapshotsByAccountSecurity = new Map<
      string,
      { tx: Investment; snapshot: PositionSnapshot }
    >();

    for (const inv of snapshotRows) {
      const snapshot = parsePositionSnapshot(inv.notes);
      if (!snapshot) continue;

      const accountKey = (
        inv.accountNumber ||
        snapshot.accountNumber ||
        inv.accountName ||
        snapshot.accountName ||
        "NO_ACCOUNT"
      )
        .trim()
        .toUpperCase();

      const snapshotDate = new Date(
        snapshot.statementDate || inv.date,
      ).getTime();

      if (
        !Number.isFinite(snapshotDate) ||
        snapshotDate !== latestSnapshotDateByAccount.get(accountKey)
      ) {
        continue;
      }

      const ticker = normalizeTicker(inv);
      const securityKey = ticker || inv.name.trim().toUpperCase();
      const snapshotKey = `${accountKey}|${securityKey}`;
      const existing = latestSnapshotsByAccountSecurity.get(snapshotKey);

      if (
        !existing ||
        new Date(inv.date).getTime() > new Date(existing.tx.date).getTime()
      ) {
        latestSnapshotsByAccountSecurity.set(snapshotKey, {
          tx: inv,
          snapshot,
        });
      }
    }

    const snapshotAccountKeys = new Set(latestSnapshotDateByAccount.keys());

    // Group historical transactions by account + security.
    const groups = new Map<string, Investment[]>();

    for (const inv of filteredInvestments) {
      if (isPositionSnapshot(inv)) continue;

      const ticker = normalizeTicker(inv);
      const securityKey = ticker || inv.name.trim().toUpperCase();
      const accountKey = (inv.accountNumber || inv.accountName || "NO_ACCOUNT")
        .trim()
        .toUpperCase();

      const key = `${accountKey}|${securityKey}`;

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(inv);
    }

    // Include current positions that have no transaction history.
    for (const [key, snapshotEntry] of latestSnapshotsByAccountSecurity) {
      if (!groups.has(key)) groups.set(key, [snapshotEntry.tx]);
    }

    for (const [key, transactions] of groups.entries()) {
      const firstTransaction = transactions[0];
      if (!firstTransaction) continue;

      const normalTransactions = transactions.filter(
        (tx) => !isPositionSnapshot(tx),
      );

      const ledger = calculateTransactionLedger(normalTransactions);

      const accountKey = (
        firstTransaction.accountNumber ||
        firstTransaction.accountName ||
        "NO_ACCOUNT"
      )
        .trim()
        .toUpperCase();

      const ticker = normalizeTicker(firstTransaction);
      const securityKey = ticker || firstTransaction.name.trim().toUpperCase();
      const snapshotKey = `${accountKey}|${securityKey}`;
      const latestSnapshot =
        latestSnapshotsByAccountSecurity.get(snapshotKey) ?? null;

      // If Fidelity supplied a current snapshot for this account, absence
      // from that snapshot means the current holding is zero.
      if (snapshotAccountKeys.has(accountKey) && !latestSnapshot) {
        continue;
      }

      let shares = ledger.shares;
      let costBasis = ledger.costBasis;
      let marketValueUSD = 0;
      let snapshotGainUSD = 0;

      if (latestSnapshot) {
        const snapshot = latestSnapshot.snapshot;
        shares = Math.max(
          0,
          snapshot.quantity ?? latestSnapshot.tx.shares ?? 0,
        );
        costBasis = Math.max(0, snapshot.costBasis);
        marketValueUSD = Math.max(0, snapshot.marketValue);
        snapshotGainUSD = snapshot.unrealizedGain;
      }

      const livePrice =
        ticker && livePrices[ticker] !== undefined
          ? livePrices[ticker]
          : undefined;

      const snapshotPrice =
        shares > 0 && marketValueUSD > 0 ? marketValueUSD / shares : undefined;

      const avgCost = shares > 0 ? costBasis / shares : 0;
      const currentPrice =
        latestSnapshot && snapshotPrice !== undefined
          ? snapshotPrice
          : (livePrice ?? snapshotPrice ?? avgCost);

      const isGhanaAsset =
        firstTransaction.region === RegionType.GHANA ||
        firstTransaction.currency === CurrencyType.GHS;

      const fxRate =
        safeNumber(firstTransaction.exchangeRate) > 0
          ? safeNumber(firstTransaction.exchangeRate)
          : 1;

      let currentValueUSD: number;
      let currentValueGHS: number;

      if (isGhanaAsset) {
        currentValueGHS = shares * currentPrice;
        currentValueUSD = currentValueGHS * fxRate;
      } else {
        // For Fidelity snapshots, keep Fidelity's reported market value.
        // This prevents the transaction ledger from inventing current shares.
        currentValueUSD = latestSnapshot
          ? marketValueUSD
          : livePrice !== undefined
            ? shares * livePrice
            : shares * currentPrice;

        currentValueGHS = currentValueUSD / fxRate;
      }

      const unrealizedGainUSD = latestSnapshot
        ? snapshotGainUSD
        : currentValueUSD - (isGhanaAsset ? costBasis * fxRate : costBasis);

      const unrealizedGainGHS = currentValueGHS - costBasis;

      const returnPercentage =
        latestSnapshot && costBasis > 0
          ? (snapshotGainUSD / costBasis) * 100
          : costBasis > 0
            ? (((isGhanaAsset ? currentValueGHS : currentValueUSD) -
                costBasis) /
                costBasis) *
              100
            : 0;

      accountHoldings.set(key, {
        key,
        name: firstTransaction.name,
        tickerOrSymbol: firstTransaction.tickerOrSymbol,
        assetClass: firstTransaction.assetClass,
        region: firstTransaction.region,
        currency: firstTransaction.currency,

        totalShares: shares,
        totalContributed: costBasis,
        totalContributedUSD: isGhanaAsset ? costBasis * fxRate : costBasis,

        avgPricePerShare: avgCost,
        currentPricePerShare: currentPrice,

        currentValueUSD,
        currentValueGHS,

        unrealizedGainUSD,
        unrealizedGainGHS,
        returnPercentage,
        weightPercentage: 0,

        realizedGainUSD: isGhanaAsset
          ? ledger.realizedGain * fxRate
          : ledger.realizedGain,
        realizedGainGHS: isGhanaAsset
          ? ledger.realizedGain
          : ledger.realizedGain / fxRate,

        dividendIncomeUSD: isGhanaAsset
          ? ledger.dividends * fxRate
          : ledger.dividends,
        dividendIncomeGHS: isGhanaAsset
          ? ledger.dividends
          : ledger.dividends / fxRate,

        totalInvestedUSD: isGhanaAsset
          ? ledger.invested * fxRate
          : ledger.invested,
        totalInvestedGHS: isGhanaAsset
          ? ledger.invested
          : ledger.invested / fxRate,

        totalSaleProceedsUSD: isGhanaAsset
          ? ledger.saleProceeds * fxRate
          : ledger.saleProceeds,
        totalSaleProceedsGHS: isGhanaAsset
          ? ledger.saleProceeds
          : ledger.saleProceeds / fxRate,

        transactions: normalTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      });
    }

    // ------------------------------------------------------------
    // AGGREGATE CURRENT POSITIONS ACROSS ACCOUNTS
    // ------------------------------------------------------------
    // The account/security ledger above is intentionally calculated per
    // Fidelity account so that a missing position in one account cannot be
    // confused with a position in another account.
    //
    // The Cumulative Holdings table, however, is a portfolio-level view.
    // Therefore the same security must appear only once, with its current
    // shares/value combined across all accounts.
    const portfolioMap = new Map<string, CumulativeHolding>();

    for (const holding of accountHoldings.values()) {
      const ticker = normalizeTicker({
        tickerOrSymbol: holding.tickerOrSymbol,
        name: holding.name,
      } as Investment);
      const portfolioKey = ticker || holding.name.trim().toUpperCase();
      const existing = portfolioMap.get(portfolioKey);

      if (!existing) {
        portfolioMap.set(portfolioKey, {
          ...holding,
          key: portfolioKey,
          transactions: [...holding.transactions],
        });
        continue;
      }

      existing.totalShares += holding.totalShares;
      existing.totalContributed += holding.totalContributed;
      existing.totalContributedUSD += holding.totalContributedUSD;
      existing.currentValueUSD += holding.currentValueUSD;
      existing.currentValueGHS += holding.currentValueGHS;
      existing.unrealizedGainUSD += holding.unrealizedGainUSD;
      existing.unrealizedGainGHS += holding.unrealizedGainGHS;
      existing.realizedGainUSD += holding.realizedGainUSD;
      existing.realizedGainGHS += holding.realizedGainGHS;
      existing.dividendIncomeUSD += holding.dividendIncomeUSD;
      existing.dividendIncomeGHS += holding.dividendIncomeGHS;
      existing.totalInvestedUSD += holding.totalInvestedUSD;
      existing.totalInvestedGHS += holding.totalInvestedGHS;
      existing.totalSaleProceedsUSD += holding.totalSaleProceedsUSD;
      existing.totalSaleProceedsGHS += holding.totalSaleProceedsGHS;
      existing.transactions.push(...holding.transactions);

      // Recalculate the portfolio-level average/current price from the
      // aggregated position instead of averaging account-level prices.
      existing.avgPricePerShare =
        existing.totalShares > 0
          ? existing.totalContributed / existing.totalShares
          : 0;

      existing.currentPricePerShare =
        existing.totalShares > 0 && existing.currentValueUSD > 0
          ? existing.currentValueUSD / existing.totalShares
          : holding.currentPricePerShare;

      existing.returnPercentage =
        existing.totalContributedUSD > 0
          ? (existing.unrealizedGainUSD / existing.totalContributedUSD) * 100
          : 0;
    }

    // Only securities with a CURRENT position greater than zero belong in
    // the Cumulative Holdings table. Historical BUY/SELL transactions are
    // still retained in the transaction history.
    const calculated = Array.from(portfolioMap.values()).filter(
      (holding) =>
        Number.isFinite(holding.totalShares) &&
        holding.totalShares > 0.0000000001,
    );

    const totalPortfolioValueUSD = calculated.reduce(
      (sum, holding) => sum + holding.currentValueUSD,
      0,
    );

    return calculated.map((holding) => ({
      ...holding,
      transactions: holding.transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
      weightPercentage:
        totalPortfolioValueUSD > 0
          ? (holding.currentValueUSD / totalPortfolioValueUSD) * 100
          : 0,
    }));
  }, [filteredInvestments, livePrices]);
  // --- PORTFOLIO SUMMARY STATS ---
  const portfolioStats = useMemo(() => {
    const isGhanaFilter = regionFilter === "GHANA";

    const totalCostBasis = cumulativeHoldings.reduce(
      (sum, holding) =>
        sum +
        (isGhanaFilter
          ? holding.totalContributed
          : holding.totalContributedUSD),
      0,
    );

    const totalMarketValue = cumulativeHoldings.reduce(
      (sum, holding) =>
        sum +
        (isGhanaFilter ? holding.currentValueGHS : holding.currentValueUSD),
      0,
    );

    const totalRealized = cumulativeHoldings.reduce(
      (sum, holding) =>
        sum +
        (isGhanaFilter ? holding.realizedGainGHS : holding.realizedGainUSD),
      0,
    );

    const totalDividends = cumulativeHoldings.reduce(
      (sum, holding) =>
        sum +
        (isGhanaFilter ? holding.dividendIncomeGHS : holding.dividendIncomeUSD),
      0,
    );

    // Unrealized gain only
    const unrealizedGain = totalMarketValue - totalCostBasis;

    // TRUE total economic gain:
    //
    // unrealized gain
    // + realized gain
    // + dividends
    //
    const totalGain = unrealizedGain + totalRealized + totalDividends;

    const totalReturnPercent =
      totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

    // ----------------------------------------------------------
    // CAGR
    // ----------------------------------------------------------
    let cagr = 0;

    if (
      filteredInvestments.length > 0 &&
      totalCostBasis > 0 &&
      totalMarketValue > 0
    ) {
      const validDates = filteredInvestments
        .map((inv) => new Date(inv.date).getTime())
        .filter(Number.isFinite);

      if (validDates.length > 0) {
        const oldestDate = Math.min(...validDates);

        const yearsElapsed = calculateYearsElapsed(oldestDate, currentDate);

        cagr =
          Math.pow(totalMarketValue / totalCostBasis, 1 / yearsElapsed) - 1;

        cagr *= 100;
      }
    }

    return {
      totalContributed: totalCostBasis,

      totalMarketValue,

      totalGain,

      unrealizedGain,

      totalReturnPercent,

      totalRealized,

      totalDividends,

      cagr: Number.isFinite(cagr) ? cagr : 0,

      currencySymbol: isGhanaFilter ? "GH " : "$",
    };
  }, [cumulativeHoldings, regionFilter, filteredInvestments, currentDate]);

  const selectedHolding = useMemo(() => {
    if (!selectedHoldingKey) return null;
    return cumulativeHoldings.find((h) => h.key === selectedHoldingKey) || null;
  }, [cumulativeHoldings, selectedHoldingKey]);

  // Handlers
  const handleAddInvestment = (newInv: Investment) => {
    setInvestments((prev) => [newInv, ...prev]);
    router.refresh();
  };

  const handleUpdateInvestment = (updatedInv: Investment) => {
    setInvestments((prev) =>
      prev.map((item) => (item.id === updatedInv.id ? updatedInv : item)),
    );
    router.refresh();
  };

  const handleDeleteInvestment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction entry?"))
      return;

    setDeletingId(id);
    const res = await deleteInvestment(id);
    if (res.success) {
      setInvestments((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } else {
      alert(res.error || "Failed to delete item.");
    }
    setDeletingId(null);
  };

  // Chart Data
  const tickerAllocationData = useMemo(() => {
    return cumulativeHoldings
      .map((item) => ({
        name: item.tickerOrSymbol || item.name,
        value:
          regionFilter === "GHANA"
            ? item.currentValueGHS
            : item.currentValueUSD,
      }))
      .filter((item) => item.value > 0);
  }, [cumulativeHoldings, regionFilter]);

  const assetClassAllocationData = useMemo(() => {
    const map = new Map<string, number>();
    cumulativeHoldings.forEach((item) => {
      const label = item.assetClass;
      const current = map.get(label) || 0;
      const val =
        regionFilter === "GHANA" ? item.currentValueGHS : item.currentValueUSD;
      map.set(label, current + val);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [cumulativeHoldings, regionFilter]);

  const assetPerformanceData = useMemo(() => {
    return cumulativeHoldings.map((item) => ({
      name: item.tickerOrSymbol || item.name,
      returnPct: parseFloat(item.returnPercentage.toFixed(2)),
    }));
  }, [cumulativeHoldings]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-slate-900">
      <div className="max-w-[1600px] mx-auto px-4 py-5 md:px-6 md:py-7 space-y-5">
        {/* SaaS HEADER */}
        <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    Investment Portfolio
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live tracking
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Monitor performance, holdings, and transaction activity in one
                  place.
                </p>
                {lastUpdated && (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Prices last synchronized at {lastUpdated}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFullRefresh}
                disabled={loading || isLoadingPrices}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-500 ${
                    loading || isLoadingPrices ? "animate-spin" : ""
                  }`}
                />
                {isLoadingPrices ? "Updating..." : "Refresh"}
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Upload className="w-4 h-4" />
                Import / Sync
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                Add transaction
              </button>
            </div>
          </div>

          {/* PRIMARY PORTFOLIO TABS */}
          <div className="border-t border-slate-100 px-4 md:px-5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                {
                  id: "USA" as const,
                  label: "US Investments",
                  subtitle: "USD portfolio",
                  icon: "",
                },
                {
                  id: "GHANA" as const,
                  label: "Ghana Investments",
                  subtitle: "GHS portfolio",
                  icon: "",
                },
              ].map((tab) => {
                const active = regionFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setRegionFilter(tab.id);
                      setSelectedHoldingKey(null);
                    }}
                    className={`relative flex min-w-45 items-center gap-3 border-b-2 px-3 py-3.5 text-left transition ${
                      active
                        ? "border-slate-900 text-slate-950"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">
                        {tab.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        {tab.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Active portfolio
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                {regionLabel}
              </h2>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {regionCurrencyLabel}
              </span>
              {filteredInvestments.some(isPositionSnapshot) && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Fidelity current positions synced
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {filteredInvestments.length} transaction
            {filteredInvestments.length === 1 ? "" : "s"} recorded
          </p>
        </div>

        {/* METRICS DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Invested */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Contributed
              </span>
              <DollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {portfolioStats.currencySymbol}
              {portfolioStats.totalContributed.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">
              Cost Basis Total
            </span>
          </div>

          {/* Current Market Value */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Market Value
              </span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-600 font-mono tracking-tight">
              {portfolioStats.currencySymbol}
              {portfolioStats.totalMarketValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-blue-600/80 mt-1 block font-medium">
              Live Valuation
            </span>
          </div>

          {/* Unrealized Gain/Loss */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Net Gain
              </span>
              <span
                className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                  portfolioStats.totalGain >= 0
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                }`}
              >
                {portfolioStats.totalReturnPercent >= 0 ? "+" : ""}
                {portfolioStats.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight ${
                portfolioStats.totalGain >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {portfolioStats.totalGain >= 0 ? "+" : ""}
              {portfolioStats.currencySymbol}
              {portfolioStats.totalGain.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">
              Unrealized P&L
            </span>
          </div>

          {/* CAGR Growth */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                CAGR
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight ${
                portfolioStats.cagr >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {portfolioStats.cagr.toFixed(2)}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">
              Annualized Compound Return
            </span>
          </div>

          {/* Income & Realized */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Income
              </span>
              <Globe className="w-4 h-4 text-amber-600" />
            </div>
            <div className="space-y-0.5 mt-2 font-mono text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-sans">Realized:</span>
                <span className="font-bold">
                  {portfolioStats.currencySymbol}
                  {portfolioStats.totalRealized.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span className="text-slate-500 font-sans">Dividends:</span>
                <span className="font-bold">
                  {portfolioStats.currencySymbol}
                  {portfolioStats.totalDividends.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ALLOCATION & PERFORMANCE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Pie Chart: Ticker Breakdown */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-80">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-500" /> Ticker
                weights
              </h2>
              <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {regionFilter === "GHANA" ? "GHS" : "USD"}
              </span>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              {tickerAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tickerAllocationData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tickerAllocationData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PALETTE[index % PALETTE.length]}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${regionFilter === "GHANA" ? "GH " : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Market Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#0F172A",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      wrapperStyle={{ fontSize: "10px", color: "#64748B" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs font-medium">
                  No holdings available
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart: Asset Class Mix */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-80">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-amber-600" /> Asset Classes
            </h2>
            <div className="flex-1 w-full flex items-center justify-center">
              {assetClassAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetClassAllocationData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {assetClassAllocationData.map((_, index) => (
                        <Cell
                          key={`ac-cell-${index}`}
                          fill={PALETTE[(index + 3) % PALETTE.length]}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${regionFilter === "GHANA" ? "GH " : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Market Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#0F172A",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      wrapperStyle={{ fontSize: "10px", color: "#64748B" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs font-medium">
                  No holdings available
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart: Relative Performance */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-80">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Return %
              Comparison
            </h2>
            <div className="flex-1 w-full">
              {assetPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assetPerformanceData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: ValueType | undefined) => [
                        `${val}%`,
                        "Return",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <ReferenceLine y={0} stroke="#CBD5E1" />
                    <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
                      {assetPerformanceData.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={entry.returnPct >= 0 ? "#10B981" : "#F43F5E"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs flex items-center justify-center h-full font-medium">
                  No performance metrics available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DETAILED CUMULATIVE HOLDINGS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Cumulative Holdings Breakdown
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
              {cumulativeHoldings.length} Active Position
              {cumulativeHoldings.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-3 text-slate-500 text-xs font-medium">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                Loading portfolio holdings...
              </div>
            ) : cumulativeHoldings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-medium">
                No active holdings recorded in this portfolio yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Asset / Symbol</th>
                    <th className="px-4 py-3.5">Asset Class</th>
                    <th className="px-4 py-3.5">Weight %</th>
                    <th className="px-4 py-3.5 text-right">Shares</th>
                    <th className="px-4 py-3.5 text-right">
                      Avg Cost vs Price
                    </th>
                    <th className="px-4 py-3.5 text-right">Cost Basis</th>
                    <th className="px-4 py-3.5 text-right">Market Value</th>
                    <th className="px-4 py-3.5 text-right">
                      Unrealized Gain / Loss
                    </th>
                    <th className="px-4 py-3.5 text-center">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {cumulativeHoldings.map((holding) => {
                    const ticker = (holding.tickerOrSymbol || "")
                      .trim()
                      .toUpperCase();
                    const isLive = Boolean(livePrices[ticker]);

                    const displayGHS = regionFilter === "GHANA";
                    const currencySymbol = displayGHS ? "GH " : "$";

                    const contributedVal = displayGHS
                      ? holding.totalContributed
                      : holding.totalContributedUSD;

                    const marketVal = displayGHS
                      ? holding.currentValueGHS
                      : holding.currentValueUSD;

                    const gainVal = displayGHS
                      ? holding.unrealizedGainGHS
                      : holding.unrealizedGainUSD;

                    const isGain = gainVal >= 0;

                    return (
                      <tr
                        key={holding.key}
                        className="hover:bg-slate-100/30 transition-colors group"
                      >
                        {/* Asset & Symbol */}
                        <td className="px-4 py-3.5 font-sans">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {holding.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>
                              {holding.tickerOrSymbol || holding.assetClass}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 uppercase">
                              {holding.region}
                            </span>
                          </div>
                        </td>

                        {/* Asset Class Badge */}
                        <td className="px-4 py-3.5 font-sans">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold border border-slate-300 text-slate-700">
                            {holding.assetClass}
                          </span>
                        </td>

                        {/* Portfolio Weight % */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {holding.weightPercentage.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.min(holding.weightPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Shares */}
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-700">
                          {holding.totalShares.toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}
                        </td>

                        {/* Avg Cost vs Current Price */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="text-slate-700 text-[11px]">
                            <span className="text-slate-500 font-sans mr-1">
                              Avg:
                            </span>
                            {currencySymbol}
                            {holding.avgPricePerShare.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-1 mt-0.5 ${
                              isLive ? "text-emerald-600" : "text-blue-600"
                            }`}
                          >
                            <span className="text-slate-500 font-sans">
                              Now:
                            </span>
                            {currencySymbol}
                            {holding.currentPricePerShare?.toFixed(2)}
                            {isLive && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                                title="Real-time price feed active"
                              />
                            )}
                          </div>
                        </td>

                        {/* Cost Basis */}
                        <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                          {currencySymbol}
                          {contributedVal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Market Value */}
                        <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                          {currencySymbol}
                          {marketVal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Net Unrealized Gain / Loss */}
                        <td className="px-4 py-3.5 text-right font-bold">
                          <div
                            className={`flex items-center justify-end gap-1 ${
                              isGain ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isGain ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isGain ? "+" : ""}
                              {currencySymbol}
                              {gainVal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] block mt-0.5 font-sans ${
                              isGain ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            ({holding.returnPercentage.toFixed(2)}%)
                          </span>
                        </td>

                        {/* Actions / Transaction History */}
                        <td className="px-4 py-3.5 text-center font-sans">
                          <button
                            onClick={() => setSelectedHoldingKey(holding.key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-blue-600 text-[10px] font-bold transition-all hover:border-slate-300"
                          >
                            <History className="w-3 h-3" /> Logs (
                            {holding.transactions.length})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isImportModalOpen && (
        <PortfolioImportModal
          region={regionFilter}
          existingInvestments={investments}
          onClose={() => setIsImportModalOpen(false)}
          onImported={async () => {
            setIsImportModalOpen(false);
            await fetchDbData();
          }}
        />
      )}

      {/* TRANSACTION LOGS MODAL */}
      {selectedHolding && (
        <TransactionsHistoryModal
          holding={selectedHolding}
          onClose={() => setSelectedHoldingKey(null)}
          onEdit={(tx) => setEditingInvestment(tx)}
          onDelete={handleDeleteInvestment}
          deletingId={deletingId}
        />
      )}

      {/* ADD INVESTMENT MODAL */}
      {isAddModalOpen && (
        <AddInvestmentModal
          defaultRegion={
            regionFilter === "GHANA" ? RegionType.GHANA : RegionType.USA
          }
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddInvestment}
        />
      )}

      {/* EDIT INVESTMENT MODAL */}
      {editingInvestment && (
        <EditInvestmentModal
          investment={editingInvestment}
          onClose={() => setEditingInvestment(null)}
          onUpdate={handleUpdateInvestment}
        />
      )}
    </div>
  );
}

// --- MODAL COMPONENTS ---

function TransactionsHistoryModal({
  holding,
  onClose,
  onEdit,
  onDelete,
  deletingId,
}: {
  holding: CumulativeHolding;
  onClose: () => void;
  onEdit: (tx: Investment) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{holding.name}</span>
                {holding.tickerOrSymbol && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
                    {holding.tickerOrSymbol}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Transaction history · {holding.transactions.length} entr
                {holding.transactions.length === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Shares / Price</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">USD Total</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {holding.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-100/40">
                  <td className="px-3 py-3 text-slate-700 font-sans">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === InvestmentTransactionType.BUY
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : tx.type === InvestmentTransactionType.SELL
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {tx.shares ? (
                      <div className="text-slate-700">
                        {tx.shares} @{" "}
                        {tx.currency === CurrencyType.USD ? "$" : "GH "}
                        {tx.pricePerShare}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {tx.currency === CurrencyType.USD ? "$" : "GH "}
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    $
                    {tx.amountUSD.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 transition-colors"
                        title="Edit entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 text-rose-600 transition-colors disabled:opacity-50"
                        title="Delete entry"
                      >
                        {deletingId === tx.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface InvestmentFormData {
  name: string;
  tickerOrSymbol: string;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  type: InvestmentTransactionType;
  shares: string;
  pricePerShare: string;
  amount: string;
  exchangeRate: string;
  date: string;
  notes: string;
}

function AddInvestmentModal({
  defaultRegion,
  onClose,
  onAdd,
}: {
  defaultRegion: RegionType;
  onClose: () => void;
  onAdd: (investment: Investment) => void;
}) {
  const defaultCurrency =
    defaultRegion === RegionType.GHANA ? CurrencyType.GHS : CurrencyType.USD;
  const defaultExchangeRate =
    defaultRegion === RegionType.GHANA ? "0.086" : "1.0";

  const [formData, setFormData] = useState<InvestmentFormData>({
    name: "",
    tickerOrSymbol: "",
    assetClass: AssetType.ETF,
    region: defaultRegion,
    currency: defaultCurrency,
    type: InvestmentTransactionType.BUY,
    shares: "",
    pricePerShare: "",
    amount: "",
    exchangeRate: defaultExchangeRate,
    date: toLocalDateString(new Date()),
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSharesChange = (val: string) => {
    setFormData((prev) => {
      const s = parseFloat(val);
      const p = parseFloat(prev.pricePerShare);
      const computedAmount =
        !isNaN(s) && !isNaN(p) && s > 0 && p > 0
          ? (s * p).toFixed(2)
          : prev.amount;
      return { ...prev, shares: val, amount: computedAmount };
    });
  };

  const handlePriceChange = (val: string) => {
    setFormData((prev) => {
      const s = parseFloat(prev.shares);
      const p = parseFloat(val);
      const computedAmount =
        !isNaN(s) && !isNaN(p) && s > 0 && p > 0
          ? (s * p).toFixed(2)
          : prev.amount;
      return { ...prev, pricePerShare: val, amount: computedAmount };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const amountVal = parseFloat(formData.amount) || 0;
    const exRateVal = parseFloat(formData.exchangeRate) || 1.0;

    const selectedDate = formData.date
      ? new Date(`${formData.date}T00:00:00.000Z`)
      : new Date();

    const payload = {
      name: formData.name,
      tickerOrSymbol: formData.tickerOrSymbol || null,
      assetClass: formData.assetClass,
      region: formData.region,
      currency: formData.currency,
      type: formData.type,
      shares: formData.shares ? parseFloat(formData.shares) : null,
      pricePerShare: formData.pricePerShare
        ? parseFloat(formData.pricePerShare)
        : null,
      amount: amountVal,
      exchangeRate: exRateVal,
      date: selectedDate,
      notes: formData.notes || null,
    };

    const res = await createInvestment(payload);
    if (res.success && res.data) {
      const formatted: Investment = normalizeInvestmentFromDatabase({
        ...res.data,
        date: res.data.date,
        settlementDate: res.data.settlementDate,
      });
      onAdd(formatted);
      onClose();
    } else {
      setSubmitError(res.error || "Failed to create investment.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Add Transaction Entry
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Scancom PLC (MTN)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={formData.tickerOrSymbol}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tickerOrSymbol: e.target.value,
                  }))
                }
                placeholder="e.g. MTNGH"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Transaction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as InvestmentTransactionType,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value={InvestmentTransactionType.BUY}>BUY</option>
                <option value={InvestmentTransactionType.SELL}>SELL</option>
                <option value={InvestmentTransactionType.DRIP}>DRIP</option>
                <option value={InvestmentTransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Asset Class
              </label>
              <select
                value={formData.assetClass}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assetClass: e.target.value as AssetType,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                {Object.values(AssetType).map((ac) => (
                  <option key={ac} value={ac}>
                    {ac}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Shares
              </label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Price / Share
              </label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Total Amount *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            {formData.currency === CurrencyType.GHS && (
              <div>
                <label className="block text-slate-500 mb-1 font-medium">
                  FX Rate (GHS to USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.exchangeRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      exchangeRate: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-slate-900/15"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInvestmentModal({
  investment,
  onClose,
  onUpdate,
}: {
  investment: Investment;
  onClose: () => void;
  onUpdate: (investment: Investment) => void;
}) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: investment.name,
    tickerOrSymbol: investment.tickerOrSymbol || "",
    assetClass: investment.assetClass,
    region: investment.region,
    currency: investment.currency,
    type: investment.type,
    shares: investment.shares ? investment.shares.toString() : "",
    pricePerShare: investment.pricePerShare
      ? investment.pricePerShare.toString()
      : "",
    amount: investment.amount.toString(),
    exchangeRate: investment.exchangeRate.toString(),
    date: investment.date,
    notes: investment.notes || "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSharesChange = (val: string) => {
    setFormData((prev) => {
      const s = parseFloat(val);
      const p = parseFloat(prev.pricePerShare);
      const computedAmount =
        !isNaN(s) && !isNaN(p) && s > 0 && p > 0
          ? (s * p).toFixed(2)
          : prev.amount;
      return { ...prev, shares: val, amount: computedAmount };
    });
  };

  const handlePriceChange = (val: string) => {
    setFormData((prev) => {
      const s = parseFloat(prev.shares);
      const p = parseFloat(val);
      const computedAmount =
        !isNaN(s) && !isNaN(p) && s > 0 && p > 0
          ? (s * p).toFixed(2)
          : prev.amount;
      return { ...prev, pricePerShare: val, amount: computedAmount };
    });
  };

  const handleRegionChange = (region: RegionType) => {
    const currency =
      region === RegionType.USA ? CurrencyType.USD : CurrencyType.GHS;
    const exchangeRate = region === RegionType.USA ? "1.0" : "0.086";

    setFormData((prev) => ({
      ...prev,
      region,
      currency,
      exchangeRate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const amountVal = parseFloat(formData.amount) || 0;
    const exRateVal = parseFloat(formData.exchangeRate) || 1.0;

    const selectedDate = new Date(`${formData.date}T00:00:00.000Z`);

    const payload = {
      name: formData.name,
      tickerOrSymbol: formData.tickerOrSymbol || null,
      assetClass: formData.assetClass,
      region: formData.region,
      currency: formData.currency,
      type: formData.type,
      shares: formData.shares ? parseFloat(formData.shares) : null,
      pricePerShare: formData.pricePerShare
        ? parseFloat(formData.pricePerShare)
        : null,
      amount: amountVal,
      exchangeRate: exRateVal,
      date: selectedDate,
      notes: formData.notes || null,
    };

    const res = await updateInvestment(investment.id, payload);
    if (res.success && res.data) {
      const formatted: Investment = normalizeInvestmentFromDatabase({
        ...res.data,
        date: res.data.date,
        settlementDate: res.data.settlementDate,
      });
      onUpdate(formatted);
      onClose();
    } else {
      setSubmitError(res.error || "Failed to update investment.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-500" />
            Edit Investment Transaction
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={formData.tickerOrSymbol}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tickerOrSymbol: e.target.value,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as InvestmentTransactionType,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value={InvestmentTransactionType.BUY}>BUY</option>
                <option value={InvestmentTransactionType.SELL}>SELL</option>
                <option value={InvestmentTransactionType.DRIP}>DRIP</option>
                <option value={InvestmentTransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Region
              </label>
              <select
                value={formData.region}
                onChange={(e) =>
                  handleRegionChange(e.target.value as RegionType)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value={RegionType.USA}>USA (USD)</option>
                <option value={RegionType.GHANA}>Ghana (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Asset Class
              </label>
              <select
                value={formData.assetClass}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assetClass: e.target.value as AssetType,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                {Object.values(AssetType).map((ac) => (
                  <option key={ac} value={ac}>
                    {ac}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Shares
              </label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Price / Share
              </label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">
                Total Amount *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-slate-900/15"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// IMPORT / SYNC CENTER
// -----------------------------------------------------------------------------

type ImportRegion = "USA" | "GHANA";

type ParsedImportRow = {
  name: string;
  tickerOrSymbol: string;
  type: InvestmentTransactionType;
  shares: number | null;
  pricePerShare: number | null;
  amount: number;
  date: string;
  currency: CurrencyType;
  region: RegionType;
  exchangeRate: number;
  notes: string;
  recordType?: string;
  accountNumber?: string | null;
  accountName?: string | null;
  cusip?: string | null;
  settlementDate?: string | null;
  costBasis?: number | null;
  marketValue?: number | null;
  unrealizedGain?: number | null;
  unrealizedGainPercent?: number | null;
  fingerprint?: string;
  duplicate?: boolean;

  source?: string | null;
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = (values[index] ?? "").trim();
    });
    return obj;
  });
}

function firstValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function parseNumber(value: string): number {
  const raw = value.trim();
  const isParenthesized = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[$€£,\s]/g, "").replace(/^\((.*)\)$/, "$1");

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return isParenthesized ? -Math.abs(parsed) : parsed;
}

function parseImportRows(
  rows: Record<string, string>[],
  source: "FIDELITY" | "IC_WEALTH",
  region: ImportRegion,
): ParsedImportRow[] {
  const output: ParsedImportRow[] = [];

  for (const row of rows) {
    const recordType = firstValue(row, [
      "record_type",
      "recordType",
    ]).toLowerCase();

    const hasPositionHeaders = (keys: string[]) =>
      keys.some((key) => Object.prototype.hasOwnProperty.call(row, key));

    // Fidelity Positions exports are current-position snapshots, not activity.
    // The standard Fidelity Positions CSV contains Quantity, Last price,
    // Current value and Cost basis total. Detect it explicitly so it becomes
    // the authority for CURRENT HOLDINGS.
    const looksLikeFidelityPositionsRow =
      source === "FIDELITY" &&
      hasPositionHeaders(["account_number"]) &&
      hasPositionHeaders(["symbol"]) &&
      hasPositionHeaders(["quantity"]) &&
      hasPositionHeaders(["last_price"]) &&
      hasPositionHeaders(["current_value"]) &&
      hasPositionHeaders(["cost_basis_total"]);

    const looksLikePositionRow =
      looksLikeFidelityPositionsRow ||
      (source === "FIDELITY" &&
        hasPositionHeaders([
          "market_value",
          "current_value",
          "current_market_value",
        ]) &&
        hasPositionHeaders([
          "cost_basis",
          "cost_basis_total",
          "total_cost_basis",
          "cost",
        ]));

    const rawDate =
      firstValue(row, [
        "date",
        "transaction_date",
        "trade_date",
        "run_date",
        "as_of_date",
        "as_of",
        "statement_date",
        "settlement_date",
      ]) || (looksLikePositionRow ? toLocalDateString(new Date()) : "");

    if (!rawDate) continue;

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) continue;

    const rawSymbol = firstValue(row, [
      "symbol",
      "ticker",
      "ticker_symbol",
      "security_symbol",
    ]).toUpperCase();

    const cusip = firstValue(row, [
      "cusip",
      "security_id",
      "security_identifier",
    ]).toUpperCase();

    const name =
      firstValue(row, [
        "name",
        "security_name",
        "description",
        "security",
        "asset_name",
        "asset",
      ]) ||
      rawSymbol ||
      "Imported investment";

    const symbol = resolveInvestmentSymbol(rawSymbol || cusip, name);

    const accountNumber =
      firstValue(row, ["account_number", "account_no", "accountnumber"]) ||
      null;

    const accountName =
      firstValue(row, ["account_name", "account", "account_name_"]) || null;

    const settlementDateRaw = firstValue(row, [
      "settlement_date",
      "settlement",
    ]);

    const settlementDate = settlementDateRaw
      ? (() => {
          const d = new Date(settlementDateRaw);
          return Number.isNaN(d.getTime())
            ? null
            : d.toISOString().slice(0, 10);
        })()
      : null;

    // Fidelity's CSV has a generic "Type" column (often "Cash") and
    // the real transaction description in "Action". Always prefer Action.
    const action = firstValue(row, [
      "action",
      "transaction",
      "activity_type",
      "transaction_type",
      "type",
    ]).toUpperCase();

    const quantity = parseNumber(
      firstValue(row, ["quantity", "shares", "units", "qty"]),
    );
    const price = parseNumber(
      firstValue(row, [
        "price",
        "price_per_share",
        "share_price",
        "last_price",
      ]),
    );
    const rawAmount = firstValue(row, [
      "amount",
      "transaction_amount",
      "net_amount",
      "total_amount",
      "consideration",
      "proceeds",
      "amount_usd",
      "amount_ghs",
    ]);
    const amount =
      Math.abs(parseNumber(rawAmount)) || Math.abs(quantity * price);

    let type: InvestmentTransactionType = InvestmentTransactionType.BUY;
    if (/SELL|SOLD|SALE|DISPOSAL/.test(action)) {
      type = InvestmentTransactionType.SELL;
    } else if (/REINVESTMENT|DRIP/.test(action)) {
      type = InvestmentTransactionType.DRIP;
    } else if (/DIVIDEND/.test(action)) {
      type = InvestmentTransactionType.DIVIDEND;
    } else if (/INTEREST/.test(action)) {
      type = InvestmentTransactionType.INTEREST;
    } else if (/FEE|COMMISSION/.test(action)) {
      type = InvestmentTransactionType.FEE;
    } else if (/TAX/.test(action)) {
      type = InvestmentTransactionType.TAX;
    } else if (/CONTRIBUTION/.test(action)) {
      type = InvestmentTransactionType.CONTRIBUTION;
    } else if (/TRANSFER.*RECEIVED|ELECTRONIC FUNDS TRANSFER/.test(action)) {
      type = InvestmentTransactionType.TRANSFER_IN;
    } else if (/WITHDRAWAL|TRANSFER.*OUT/.test(action)) {
      type = InvestmentTransactionType.TRANSFER_OUT;
    } else if (/BUY|BOUGHT|PURCHASE/.test(action)) {
      type = InvestmentTransactionType.BUY;
    } else if (/CASH|DEPOSIT/.test(action)) {
      type = InvestmentTransactionType.CASH;
    }

    const currency = region === "GHANA" ? CurrencyType.GHS : CurrencyType.USD;
    const explicitCurrency = firstValue(row, [
      "currency",
      "currency_code",
      "iso_currency_code",
    ]).toUpperCase();
    const finalCurrency =
      explicitCurrency === "GHS" || explicitCurrency === "USD"
        ? (explicitCurrency as CurrencyType)
        : currency;

    const exchangeRate =
      finalCurrency === CurrencyType.GHS
        ? parseNumber(firstValue(row, ["exchange_rate", "fx_rate"])) || 0.086
        : 1;

    const date = parsedDate.toISOString().slice(0, 10);

    const hasPositionColumns =
      hasPositionHeaders([
        "market_value",
        "current_value",
        "current_market_value",
      ]) &&
      hasPositionHeaders([
        "cost_basis",
        "cost_basis_total",
        "total_cost_basis",
        "cost",
      ]);

    const isSnapshot =
      source === "FIDELITY" &&
      (recordType === "holding" ||
        recordType === "holdings" ||
        hasPositionColumns);

    if (isSnapshot) {
      const costBasis = Math.abs(
        parseNumber(
          firstValue(row, ["cost_basis", "cost", "total_cost_basis"]),
        ),
      );
      const marketValue = Math.abs(
        parseNumber(
          firstValue(row, [
            "market_value",
            "ending_market_value",
            "current_value",
          ]),
        ),
      );
      const unrealizedGain = parseNumber(
        firstValue(row, [
          "unrealized_gain",
          "unrealized_gain_loss",
          "total_gain_loss",
          "total_gain_loss_dollar",
          "gain_loss",
        ]),
      );
      const unrealizedGainPercent = parseNumber(
        firstValue(row, [
          "unrealized_gain_percent",
          "gain_loss_percent",
          "total_gain_loss_percent",
          "return_percent",
        ]),
      );
      const snapshotSymbol = symbol || (/^CASH$/i.test(name) ? "CASH" : "");

      if (
        snapshotSymbol &&
        costBasis >= 0 &&
        marketValue >= 0 &&
        (quantity > 0 || marketValue > 0 || /CASH|MONEY MARKET/i.test(name))
      ) {
        const snapshotQuantity = Math.max(0, quantity);
        const snapshotPrice =
          price > 0
            ? price
            : snapshotQuantity > 0
              ? marketValue / snapshotQuantity
              : 0;

        output.push({
          name,
          tickerOrSymbol: snapshotSymbol,
          type: InvestmentTransactionType.HOLDING_SNAPSHOT,
          shares: snapshotQuantity,
          pricePerShare: snapshotPrice > 0 ? snapshotPrice : null,
          amount: costBasis,
          costBasis,
          marketValue,
          unrealizedGain,
          unrealizedGainPercent,
          date,
          currency: CurrencyType.USD,
          region: RegionType.USA,
          exchangeRate: 1,
          accountNumber,
          accountName,
          cusip: cusip || null,
          settlementDate: null,
          recordType: "holding",
          notes: [
            "FIDELITY_POSITION_SNAPSHOT",
            `costBasis=${costBasis}`,
            `marketValue=${marketValue}`,
            `unrealizedGain=${unrealizedGain}`,
            `unrealizedGainPercent=${unrealizedGainPercent}`,
            `quantity=${snapshotQuantity}`,
            `accountNumber=${accountNumber || ""}`,
            `accountName=${accountName || ""}`,
            `statementDate=${date}`,
            `dataSource=${looksLikeFidelityPositionsRow ? "FIDELITY_POSITIONS" : "STATEMENT"}`,
          ].join("|"),
        });
      }
      continue;
    }

    const fidelityActivity =
      source === "FIDELITY"
        ? type === InvestmentTransactionType.SELL
          ? "SELL"
          : type === InvestmentTransactionType.DRIP
            ? "DRIP"
            : type === InvestmentTransactionType.DIVIDEND
              ? "DIVIDEND"
              : type === InvestmentTransactionType.INTEREST
                ? "INTEREST"
                : type === InvestmentTransactionType.CONTRIBUTION
                  ? "CONTRIBUTION"
                  : type === InvestmentTransactionType.TRANSFER_IN
                    ? "TRANSFER_IN"
                    : type === InvestmentTransactionType.TRANSFER_OUT
                      ? "TRANSFER_OUT"
                      : type === InvestmentTransactionType.FEE
                        ? "FEE"
                        : type === InvestmentTransactionType.TAX
                          ? "TAX"
                          : "BUY"
        : "";

    output.push({
      name,
      tickerOrSymbol: symbol,
      type,
      shares: quantity > 0 ? quantity : null,
      pricePerShare: price > 0 ? price : null,
      amount,
      date,
      currency: finalCurrency,
      region:
        finalCurrency === CurrencyType.GHS ? RegionType.GHANA : RegionType.USA,
      exchangeRate,
      recordType: "transaction",
      accountNumber,
      accountName,
      cusip: cusip || null,
      settlementDate,
      source: source === "FIDELITY" ? "FIDELITY" : "IC_WEALTH",
      notes:
        source === "FIDELITY"
          ? `Imported from Fidelity Investments.|FIDELITY_ACTION=${action}|FIDELITY_ACTIVITY=${fidelityActivity}`
          : "Imported from IC Wealth / Ghana portfolio statement.",
    });
  }

  return output;
}

function investmentFingerprint(row: {
  date: string;
  tickerOrSymbol?: string | null;
  name?: string;
  type: InvestmentTransactionType;
  shares?: number | null;
  amount: number;
  accountNumber?: string | null;
  accountName?: string | null;
  recordType?: string;
  marketValue?: number | null;
  costBasis?: number | null;
  pricePerShare?: number | null;
}) {
  const resolvedSymbol = resolveInvestmentSymbol(row.tickerOrSymbol, row.name);

  const securityKey = (resolvedSymbol || row.name || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  return [
    row.date.slice(0, 10),
    securityKey,
    row.type,
    row.accountNumber || "",
    row.accountName || "",
    row.recordType || "",
    Number(row.shares || 0).toFixed(8),
    Number(row.pricePerShare || 0).toFixed(6),
    Number(row.amount || 0).toFixed(2),
    Number(row.marketValue || 0).toFixed(2),
    Number(row.costBasis || 0).toFixed(2),
  ].join("|");
}

function legacyTransactionFingerprint(row: {
  date: string;
  tickerOrSymbol?: string | null;
  name?: string;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  accountNumber?: string | null;
  accountName?: string | null;
}) {
  const resolvedSymbol = resolveInvestmentSymbol(row.tickerOrSymbol, row.name);
  const securityKey = (resolvedSymbol || row.name || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  return [
    row.date.slice(0, 10),
    securityKey,
    row.accountNumber || "",
    row.accountName || "",
    Number(row.shares || 0).toFixed(8),
    Number(row.pricePerShare || 0).toFixed(6),
    Number(row.amount || 0).toFixed(2),
  ].join("|");
}

function PortfolioImportModal({
  region,
  existingInvestments,
  onClose,
  onImported,
}: {
  region: ImportRegion;
  existingInvestments: Investment[];
  onClose: () => void;
  onImported: () => Promise<void>;
}) {
  const [source, setSource] = useState<"FIDELITY" | "IC_WEALTH">(
    region === "USA" ? "FIDELITY" : "IC_WEALTH",
  );
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const existingFingerprints = useMemo(() => {
    const strict = new Set<string>();
    const legacy = new Set<string>();

    for (const investment of existingInvestments) {
      strict.add(
        investmentFingerprint({
          date: investment.date,
          tickerOrSymbol: investment.tickerOrSymbol,
          name: investment.name,
          type: investment.type,
          shares: investment.shares,
          amount: investment.amount,
          accountNumber: investment.accountNumber,
          accountName: investment.accountName,
          recordType: isPositionSnapshot(investment)
            ? "holding"
            : "transaction",
          marketValue: investment.marketValue,
          costBasis: investment.costBasis,
          pricePerShare: investment.pricePerShare,
        }),
      );

      if (!isPositionSnapshot(investment)) {
        legacy.add(
          legacyTransactionFingerprint({
            date: investment.date,
            tickerOrSymbol: investment.tickerOrSymbol,
            name: investment.name,
            shares: investment.shares,
            pricePerShare: investment.pricePerShare,
            amount: investment.amount,
            accountNumber: investment.accountNumber,
            accountName: investment.accountName,
          }),
        );
      }
    }

    return { strict, legacy };
  }, [existingInvestments]);

  const handleFile = async (file: File) => {
    setError(null);
    setStatus(null);
    setRows([]);
    setFileName(file.name);
    setIsParsing(true);

    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["csv", "xlsx", "xls", "pdf"];
    if (!extension || !allowed.includes(extension)) {
      setError(
        "Supported formats are CSV, XLSX, XLS, and PDF financial reports.",
      );
      setIsParsing(false);
      return;
    }

    try {
      let sourceRows: Record<string, string>[] = [];

      if (extension === "csv") {
        sourceRows = parseCsv(await file.text());

        if (source === "FIDELITY" && sourceRows.length > 0) {
          const first = sourceRows[0];
          const isPositionsExport =
            Object.prototype.hasOwnProperty.call(first, "account_number") &&
            Object.prototype.hasOwnProperty.call(first, "symbol") &&
            Object.prototype.hasOwnProperty.call(first, "quantity") &&
            Object.prototype.hasOwnProperty.call(first, "last_price") &&
            Object.prototype.hasOwnProperty.call(first, "current_value") &&
            Object.prototype.hasOwnProperty.call(first, "cost_basis_total");

          if (isPositionsExport) {
            setStatus(
              "Fidelity Positions report detected. Current holdings will use this report as the source of truth.",
            );
          }
        }
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("source", source);
        formData.append("region", region);

        const response = await fetch("/api/investments/parse-statement", {
          method: "POST",
          body: formData,
        });

        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();
        let data: { rows?: Record<string, string>[]; error?: string } = {};

        if (contentType.includes("application/json")) {
          try {
            data = JSON.parse(responseText);
          } catch {
            throw new Error(
              "The statement parser returned invalid JSON. Please restart the Next.js server and make sure /api/investments/parse-statement/route.ts is installed.",
            );
          }
        } else {
          const looksLikeHtml = /<!doctype html|<html[\s>]/i.test(responseText);
          throw new Error(
            looksLikeHtml
              ? "The statement parser API returned an HTML page instead of JSON. Make sure app/api/investments/parse-statement/route.ts exists in this Next.js project, then restart the development server."
              : `The statement parser returned an unexpected response (HTTP ${response.status}).`,
          );
        }

        if (!response.ok) {
          throw new Error(data.error || "Could not read the financial report.");
        }

        sourceRows = Array.isArray(data.rows) ? data.rows : [];
      }

      const parsed = parseImportRows(sourceRows, source, region).map((row) => {
        const fingerprint = investmentFingerprint(row);
        const legacyFingerprint =
          row.recordType === "transaction"
            ? legacyTransactionFingerprint(row)
            : "";

        return {
          ...row,
          fingerprint,
          duplicate:
            existingFingerprints.strict.has(fingerprint) ||
            (legacyFingerprint !== "" &&
              existingFingerprints.legacy.has(legacyFingerprint)),
        };
      });

      if (parsed.length === 0) {
        throw new Error(
          "No recognizable Fidelity positions or investment transactions were found. Upload a Fidelity Positions CSV, Accounts History CSV, or supported statement report.",
        );
      }

      setRows(parsed);
      const duplicates = parsed.filter((row) => row.duplicate).length;
      const newCount = parsed.length - duplicates;
      setStatus(
        `${parsed.length} record${parsed.length === 1 ? "" : "s"} detected · ${newCount} new · ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The financial file could not be read.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const importRows = async (items: ParsedImportRow[]) => {
    const newItems = items.filter((item) => !item.duplicate);
    if (newItems.length === 0) {
      setStatus("All detected records already exist in your portfolio.");
      return;
    }

    setIsImporting(true);
    setError(null);
    let imported = 0;

    try {
      for (const item of newItems) {
        const result = await createInvestment({
          name: item.name,
          tickerOrSymbol: item.tickerOrSymbol || null,
          cusip: item.cusip || null,
          accountNumber: item.accountNumber || null,
          accountName: item.accountName || null,

          assetClass:
            item.recordType === "holding" &&
            /CASH|MONEY MARKET/i.test(item.name)
              ? AssetType.CASH_EQUIVALENT
              : ((Object.values(AssetType).find((value) =>
                  /EQUITY|STOCK|SHARE|ETF/i.test(String(value)),
                ) ?? Object.values(AssetType)[0]) as AssetType),

          region: item.region,
          currency: item.currency,
          type: item.type,

          shares: item.shares,
          pricePerShare: item.pricePerShare,

          amount: Math.abs(item.amount),
          costBasis: item.costBasis ?? null,
          marketValue: item.marketValue ?? null,
          unrealizedGain: item.unrealizedGain ?? null,
          unrealizedGainPercent: item.unrealizedGainPercent ?? null,

          exchangeRate: item.exchangeRate,

          date: new Date(`${item.date}T00:00:00.000Z`),
          settlementDate: item.settlementDate
            ? new Date(`${item.settlementDate}T00:00:00.000Z`)
            : null,

          fingerprint: item.fingerprint ?? null,

          source: source === "FIDELITY" ? "FIDELITY" : "IC_WEALTH",

          sourceFile: fileName,

          notes: item.notes,
        });

        if (result.success) imported += 1;
      }

      const duplicateCount = items.length - newItems.length;
      setStatus(
        `${imported} imported successfully${duplicateCount ? ` · ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} skipped` : ""}.`,
      );
      await onImported();
    } catch {
      setError(
        `Imported ${imported} transaction${imported === 1 ? "" : "s"}, but some records could not be saved.`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const newCount = rows.filter((row) => !row.duplicate).length;
  const duplicateCount = rows.filter((row) => row.duplicate).length;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                Import Financial Records
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Upload Fidelity or IC Wealth financial records. The importer
              extracts transactions and checks for duplicates before saving.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSource("FIDELITY");
                setRows([]);
                setError(null);
                setStatus(null);
              }}
              className={`rounded-2xl border p-4 text-left transition ${source === "FIDELITY" ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg"></span>
                {source === "FIDELITY" && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                Fidelity Investments
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Upload Accounts History for transactions or Fidelity Positions
                for an exact current-holdings snapshot.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSource("IC_WEALTH");
                setRows([]);
                setError(null);
                setStatus(null);
              }}
              className={`rounded-2xl border p-4 text-left transition ${source === "IC_WEALTH" ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg"></span>
                {source === "IC_WEALTH" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                IC Wealth / Ghana
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Upload your IC Wealth account statement, transaction report,
                CSV, or Excel export.
              </p>
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-7 text-center hover:border-slate-300 transition">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
              <Upload className="w-5 h-5 text-slate-700" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">
              Upload your financial report
            </p>
            <p className="mt-1 text-xs text-slate-500">
              CSV · XLSX · XLS · PDF
            </p>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" />
              {isParsing ? "Reading file..." : "Choose financial file"}
              <input
                type="file"
                accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,.pdf,application/pdf"
                className="hidden"
                disabled={isParsing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <p className="mt-3 text-[10px] text-slate-400">
              For PDF reports, text-based tables work best. Scanned/image-only
              PDFs require OCR processing.
            </p>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{fileName}</span>
              <span className="ml-auto text-slate-400">
                {rows.length} records
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}
          {status && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              {status}
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Import preview
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {newCount} new · {duplicateCount} duplicate
                    {duplicateCount === 1 ? "" : "s"} · showing first 12 records
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void importRows(rows)}
                  disabled={isImporting || newCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isImporting ? "Importing..." : `Import ${newCount} New`}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Security</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-right">Shares</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 12).map((row, index) => (
                      <tr
                        key={`${row.fingerprint}-${index}`}
                        className={row.duplicate ? "bg-amber-50/50" : ""}
                      >
                        <td className="px-3 py-2.5">
                          {row.duplicate ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-700">
                              DUPLICATE
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                              NEW
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.date}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {row.tickerOrSymbol || row.name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.type}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600">
                          {row.shares ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                          {row.currency === CurrencyType.GHS ? "GH " : "$"}
                          {row.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[10px] leading-4 text-slate-400 max-w-xl">
              The importer does not connect to your brokerage account or request
              passwords. It only processes the financial file you explicitly
              upload and skips records that match existing transactions.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
