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
} from "lucide-react";

// --- PRISMA TYPE IMPORTS ---
import {
  AssetType,
  RegionType,
  CurrencyType,
  TransactionType,
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
  type: TransactionType;
  shares?: number | null;
  pricePerShare?: number | null;
  amount: number;
  exchangeRate: number;
  amountUSD: number;
  date: string;
  status: StatusType;
  returnRate: string;
  isPositive: boolean;
  notes?: string | null;
}

export interface CumulativeHolding {
  key: string;
  name: string;
  tickerOrSymbol?: string | null;
  assetClass: AssetType;
  region: RegionType;
  currency: CurrencyType;
  totalShares: number;

  // --- CONTRIBUTION (COST BASIS) ---
  totalContributed: number;
  totalContributedUSD: number;
  avgPricePerShare: number;

  // --- MARKET VALUE ---
  currentPricePerShare?: number;
  currentValueUSD: number;
  currentValueGHS: number;
  unrealizedGainUSD: number;
  unrealizedGainGHS: number;
  returnPercentage: number;
  weightPercentage: number; // Combined Portfolio Weight %

  // --- REALIZED METRICS ---
  realizedGainUSD: number;
  realizedGainGHS: number;
  dividendIncomeUSD: number;
  dividendIncomeGHS: number;

  transactions: Investment[];
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
  const [regionFilter, setRegionFilter] = useState<"ALL" | "USA" | "GHANA">(
    "ALL",
  );

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
        const formatted: Investment[] = res.data.map((item) => ({
          ...item,
          date: toLocalDateString(item.date),
        }));
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
      const ticker = (inv.tickerOrSymbol || "").trim().toUpperCase();
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
  const filteredInvestments = useMemo(() => {
    if (regionFilter === "ALL") return investments;
    return investments.filter((i) => i.region === regionFilter);
  }, [investments, regionFilter]);

  // --- CUMULATIVE HOLDINGS CALCULATION ---
  const cumulativeHoldings = useMemo(() => {
    const map = new Map<string, CumulativeHolding>();

    filteredInvestments.forEach((inv) => {
      const groupKey = (inv.tickerOrSymbol || inv.name).trim().toUpperCase();

      const shares = inv.shares || 0;
      const amount = inv.amount || 0;
      const amountUSD = inv.amountUSD || 0;

      const isBuy = inv.type === TransactionType.BUY;
      const isSell = inv.type === TransactionType.SELL;
      const isDividend =
        inv.type === TransactionType.DRIP || inv.type === TransactionType.CASH;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          name: inv.name,
          tickerOrSymbol: inv.tickerOrSymbol,
          assetClass: inv.assetClass,
          region: inv.region,
          currency: inv.currency,
          totalShares: isBuy ? shares : isSell ? -shares : 0,
          totalContributed: isBuy ? amount : 0,
          totalContributedUSD: isBuy ? amountUSD : 0,
          avgPricePerShare: 0,
          currentValueUSD: 0,
          currentValueGHS: 0,
          unrealizedGainUSD: 0,
          unrealizedGainGHS: 0,
          returnPercentage: 0,
          weightPercentage: 0,
          realizedGainUSD: isSell ? amountUSD : 0,
          realizedGainGHS: isSell ? amount : 0,
          dividendIncomeUSD: isDividend ? amountUSD : 0,
          dividendIncomeGHS: isDividend ? amount : 0,
          transactions: [inv],
        });
      } else {
        const existing = map.get(groupKey)!;
        if (isBuy) {
          existing.totalShares += shares;
          existing.totalContributed += amount;
          existing.totalContributedUSD += amountUSD;
        } else if (isSell) {
          existing.totalShares -= shares;
          existing.realizedGainUSD += amountUSD;
          existing.realizedGainGHS += amount;
        } else if (isDividend) {
          existing.dividendIncomeUSD += amountUSD;
          existing.dividendIncomeGHS += amount;
        }
        existing.transactions.push(inv);
      }
    });

    const calculated = Array.from(map.values())
      .filter((holding) => holding.totalShares > 0)
      .map((holding) => {
        const avgPrice =
          holding.totalShares > 0
            ? holding.totalContributed / holding.totalShares
            : 0;

        const ticker = (holding.tickerOrSymbol || "").trim().toUpperCase();
        const currentPrice = livePrices[ticker] ?? avgPrice;

        const isGhanaAsset =
          holding.region === RegionType.GHANA ||
          holding.currency === CurrencyType.GHS;

        const fxRate =
          holding.totalContributed > 0
            ? holding.totalContributedUSD / holding.totalContributed
            : 1;

        const currentValueUSD = isGhanaAsset
          ? holding.totalShares * currentPrice * fxRate
          : holding.totalShares * currentPrice;

        const currentValueGHS = isGhanaAsset
          ? holding.totalShares * currentPrice
          : fxRate > 0
            ? (holding.totalShares * currentPrice) / fxRate
            : 0;

        const unrealizedGainUSD = currentValueUSD - holding.totalContributedUSD;
        const unrealizedGainGHS = currentValueGHS - holding.totalContributed;

        const returnPercentage =
          holding.totalContributedUSD > 0
            ? (unrealizedGainUSD / holding.totalContributedUSD) * 100
            : 0;

        return {
          ...holding,
          avgPricePerShare: avgPrice,
          currentPricePerShare: currentPrice,
          currentValueUSD,
          currentValueGHS,
          unrealizedGainUSD,
          unrealizedGainGHS,
          returnPercentage,
        };
      });

    // Compute portfolio total market value for weight calculations
    const totalPortfolioValUSD = calculated.reduce(
      (sum, item) => sum + item.currentValueUSD,
      0,
    );

    return calculated.map((item) => ({
      ...item,
      weightPercentage:
        totalPortfolioValUSD > 0
          ? (item.currentValueUSD / totalPortfolioValUSD) * 100
          : 0,
    }));
  }, [filteredInvestments, livePrices]);

  // --- PORTFOLIO SUMMARY STATS ---
  const portfolioStats = useMemo(() => {
    const isGhanaFilter = regionFilter === "GHANA";

    const totalContributed = cumulativeHoldings.reduce(
      (acc, curr) =>
        acc +
        (isGhanaFilter ? curr.totalContributed : curr.totalContributedUSD),
      0,
    );

    const totalMarketValue = cumulativeHoldings.reduce(
      (acc, curr) =>
        acc + (isGhanaFilter ? curr.currentValueGHS : curr.currentValueUSD),
      0,
    );

    const totalRealized = cumulativeHoldings.reduce(
      (acc, curr) =>
        acc + (isGhanaFilter ? curr.realizedGainGHS : curr.realizedGainUSD),
      0,
    );

    const totalDividends = cumulativeHoldings.reduce(
      (acc, curr) =>
        acc + (isGhanaFilter ? curr.dividendIncomeGHS : curr.dividendIncomeUSD),
      0,
    );

    const totalGain = totalMarketValue - totalContributed;
    const totalReturnPercent =
      totalContributed > 0 ? (totalGain / totalContributed) * 100 : 0;

    let cagr = 0;
    if (investments.length > 0 && totalContributed > 0) {
      const dates = investments.map((inv) => new Date(inv.date).getTime());
      const oldestDate = Math.min(...dates);
      const yearsElapsed = Math.max(
        (new Date().getTime() - oldestDate) / (1000 * 60 * 60 * 24 * 365),
        0.1,
      );

      cagr =
        (Math.pow(totalMarketValue / totalContributed, 1 / yearsElapsed) - 1) *
        100;
    }

    return {
      totalContributed,
      totalMarketValue,
      totalGain,
      totalReturnPercent,
      totalRealized,
      totalDividends,
      cagr: isNaN(cagr) ? 0 : cagr,
      currencySymbol: isGhanaFilter ? "GH₵ " : "$",
    };
  }, [cumulativeHoldings, regionFilter, investments]);

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
    <div className=" text-slate-100 p-4 md:p-4 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* TOP HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-3 rounded-md shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Portfolio Command Center
              </h1>
            </div>
            {lastUpdated && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pl-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live prices synchronized at {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFullRefresh}
              disabled={loading || isLoadingPrices}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition-all shadow-sm hover:border-slate-600 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-400 ${
                  loading || isLoadingPrices ? "animate-spin" : ""
                }`}
              />
              <span>{isLoadingPrices ? "Updating..." : "Refresh"}</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-md transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* METRICS DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Invested */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-md p-4 backdrop-blur-md shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Contributed
              </span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-white font-mono tracking-tight">
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
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-md p-4 backdrop-blur-md shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Market Value
              </span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
              {portfolioStats.currencySymbol}
              {portfolioStats.totalMarketValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[10px] text-blue-500/80 mt-1 block font-medium">
              Live Valuation
            </span>
          </div>

          {/* Unrealized Gain/Loss */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-md p-4 backdrop-blur-md shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Net Gain
              </span>
              <span
                className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                  portfolioStats.totalGain >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {portfolioStats.totalReturnPercent >= 0 ? "+" : ""}
                {portfolioStats.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight ${
                portfolioStats.totalGain >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
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
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-md p-4 backdrop-blur-md shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">
                CAGR
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div
              className={`text-xl font-black font-mono tracking-tight ${
                portfolioStats.cagr >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {portfolioStats.cagr.toFixed(2)}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">
              Annualized Compound Return
            </span>
          </div>

          {/* Income & Realized */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-md p-4 backdrop-blur-md shadow-sm flex flex-col justify-between hover:border-slate-700/80 transition-all">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Income
              </span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-0.5 mt-2 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500 font-sans">Realized:</span>
                <span className="font-bold">
                  {portfolioStats.currencySymbol}
                  {portfolioStats.totalRealized.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-amber-400">
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
          <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/80 rounded-md p-5 backdrop-blur-md shadow-sm flex flex-col h-80">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-400" /> Ticker
                Weights
              </h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(["ALL", "USA", "GHANA"] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setRegionFilter(reg)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      regionFilter === reg
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {reg === "ALL" ? "Global" : reg}
                  </button>
                ))}
              </div>
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
                          stroke="#020617"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${regionFilter === "GHANA" ? "GH₵ " : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Market Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#F8FAFC",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      wrapperStyle={{ fontSize: "10px", color: "#94A3B8" }}
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
          <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/80 rounded-md p-5 backdrop-blur-md shadow-sm flex flex-col h-80">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-amber-400" /> Asset Classes
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
                          stroke="#020617"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${regionFilter === "GHANA" ? "GH₵ " : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Market Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#F8FAFC",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      wrapperStyle={{ fontSize: "10px", color: "#94A3B8" }}
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
          <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800/80 rounded-md p-5 backdrop-blur-md shadow-sm flex flex-col h-80">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Return %
              Comparison
            </h2>
            <div className="flex-1 w-full">
              {assetPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assetPerformanceData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: ValueType | undefined) => [
                        `${val}%`,
                        "Return",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <ReferenceLine y={0} stroke="#475569" />
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
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-md overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Cumulative Holdings Breakdown
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full">
              {cumulativeHoldings.length} Positions Active
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-3 text-slate-400 text-xs font-medium">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                Loading portfolio holdings...
              </div>
            ) : cumulativeHoldings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-medium">
                No active holdings recorded in this region view.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/80">
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
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {cumulativeHoldings.map((holding) => {
                    const ticker = (holding.tickerOrSymbol || "")
                      .trim()
                      .toUpperCase();
                    const isLive = Boolean(livePrices[ticker]);

                    const displayGHS = regionFilter === "GHANA";
                    const currencySymbol = displayGHS ? "GH₵ " : "$";

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
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Asset & Symbol */}
                        <td className="px-4 py-3.5 font-sans">
                          <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {holding.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>
                              {holding.tickerOrSymbol || holding.assetClass}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500 uppercase">
                              {holding.region}
                            </span>
                          </div>
                        </td>

                        {/* Asset Class Badge */}
                        <td className="px-4 py-3.5 font-sans">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold border border-slate-700/80 text-slate-300">
                            {holding.assetClass}
                          </span>
                        </td>

                        {/* Portfolio Weight % */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">
                              {holding.weightPercentage.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
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
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-200">
                          {holding.totalShares.toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}
                        </td>

                        {/* Avg Cost vs Current Price */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="text-slate-300 text-[11px]">
                            <span className="text-slate-500 font-sans mr-1">
                              Avg:
                            </span>
                            {currencySymbol}
                            {holding.avgPricePerShare.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-1 mt-0.5 ${
                              isLive ? "text-emerald-400" : "text-blue-400"
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
                        <td className="px-4 py-3.5 text-right font-medium text-slate-300">
                          {currencySymbol}
                          {contributedVal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Market Value */}
                        <td className="px-4 py-3.5 text-right font-extrabold text-white">
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
                              isGain ? "text-emerald-400" : "text-rose-400"
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
                              isGain ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            ({holding.returnPercentage.toFixed(2)}%)
                          </span>
                        </td>

                        {/* Actions / Transaction History */}
                        <td className="px-4 py-3.5 text-center font-sans">
                          <button
                            onClick={() => setSelectedHoldingKey(holding.key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-blue-400 text-[10px] font-bold transition-all hover:border-slate-600"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{holding.name}</span>
                {holding.tickerOrSymbol && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                    {holding.tickerOrSymbol}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Transaction Ledger ({holding.transactions.length} Entry Logs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Shares / Price</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">USD Total</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {holding.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-3 text-slate-300 font-sans">
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
                        tx.type === TransactionType.BUY
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : tx.type === TransactionType.SELL
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {tx.shares ? (
                      <div className="text-slate-200">
                        {tx.shares} @{" "}
                        {tx.currency === CurrencyType.USD ? "$" : "GH₵ "}
                        {tx.pricePerShare}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-200">
                    {tx.currency === CurrencyType.USD ? "$" : "GH₵ "}
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-bold text-white">
                    $
                    {tx.amountUSD.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
                        title="Edit entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
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
  type: TransactionType;
  shares: string;
  pricePerShare: string;
  amount: string;
  exchangeRate: string;
  date: string;
  notes: string;
}

function AddInvestmentModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (investment: Investment) => void;
}) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: "",
    tickerOrSymbol: "",
    assetClass: AssetType.ETF,
    region: RegionType.USA,
    currency: CurrencyType.USD,
    type: TransactionType.BUY,
    shares: "",
    pricePerShare: "",
    amount: "",
    exchangeRate: "1.0",
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

  const handleRegionChange = (region: RegionType) => {
    const currency: CurrencyType =
      region === RegionType.USA ? CurrencyType.USD : CurrencyType.GHS;
    const exchangeRate = region === RegionType.USA ? "1.0" : "0.086";
    setFormData((prev) => ({ ...prev, region, currency, exchangeRate }));
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
      amountUSD:
        formData.currency === CurrencyType.USD
          ? amountVal
          : amountVal * exRateVal,
      date: selectedDate,
      status: StatusType.ACTIVE,
      returnRate: "0%",
      isPositive: true,
      notes: formData.notes || null,
    };

    const res = await createInvestment(payload);
    if (res.success && res.data) {
      const formatted: Investment = {
        ...res.data,
        date: toLocalDateString(res.data.date),
      };
      onAdd(formatted);
      onClose();
    } else {
      setSubmitError(res.error || "Failed to create investment.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Add Transaction Entry
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={TransactionType.BUY}>BUY</option>
                <option value={TransactionType.SELL}>SELL</option>
                <option value={TransactionType.DRIP}>DRIP</option>
                <option value={TransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Region
              </label>
              <select
                value={formData.region}
                onChange={(e) =>
                  handleRegionChange(e.target.value as RegionType)
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={RegionType.USA}>USA (USD)</option>
                <option value={RegionType.GHANA}>Ghana (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 mb-1 font-medium">
                Shares
              </label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Price / Share
              </label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {formData.currency === CurrencyType.GHS && (
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
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
    const currency: CurrencyType =
      region === RegionType.USA ? CurrencyType.USD : CurrencyType.GHS;
    const exchangeRate = region === RegionType.USA ? "1.0" : "0.086";
    setFormData((prev) => ({ ...prev, region, currency, exchangeRate }));
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
      amountUSD:
        formData.currency === CurrencyType.USD
          ? amountVal
          : amountVal * exRateVal,
      date: selectedDate,
      notes: formData.notes || null,
    };

    const res = await updateInvestment(investment.id, payload);
    if (res.success && res.data) {
      const formatted: Investment = {
        ...res.data,
        date: toLocalDateString(res.data.date),
      };
      onUpdate(formatted);
      onClose();
    } else {
      setSubmitError(res.error || "Failed to update investment.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-500" />
            Edit Investment Transaction
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={TransactionType.BUY}>BUY</option>
                <option value={TransactionType.SELL}>SELL</option>
                <option value={TransactionType.DRIP}>DRIP</option>
                <option value={TransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Region
              </label>
              <select
                value={formData.region}
                onChange={(e) =>
                  handleRegionChange(e.target.value as RegionType)
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={RegionType.USA}>USA (USD)</option>
                <option value={RegionType.GHANA}>Ghana (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 mb-1 font-medium">
                Shares
              </label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Price / Share
              </label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
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

// "use client";

// import React, { useState, useMemo, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ReferenceLine,
// } from "recharts";
// import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
// import {
//   Plus,
//   DollarSign,
//   X,
//   Briefcase,
//   Loader2,
//   RefreshCw,
//   Pencil,
//   Trash2,
//   History,
//   Layers,
//   CheckCircle2,
//   AlertCircle,
//   TrendingUp,
//   PieChart as PieChartIcon,
//   BarChart3,
//   Globe,
// } from "lucide-react";

// // --- PRISMA TYPE IMPORTS ---
// import {
//   AssetType,
//   RegionType,
//   CurrencyType,
//   TransactionType,
//   StatusType,
// } from "@/lib/generated/prisma/enums";

// import {
//   getInvestments,
//   createInvestment,
//   updateInvestment,
//   deleteInvestment,
// } from "@/app/actions/investments";

// const toLocalDateString = (date: Date | string) => {
//   const d = new Date(date);
//   if (isNaN(d.getTime())) return "";

//   const year = d.getUTCFullYear();
//   const month = String(d.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(d.getUTCDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// export interface Investment {
//   id: string;
//   name: string;
//   tickerOrSymbol?: string | null;
//   assetClass: AssetType;
//   region: RegionType;
//   currency: CurrencyType;
//   type: TransactionType;
//   shares?: number | null;
//   pricePerShare?: number | null;
//   amount: number;
//   exchangeRate: number;
//   amountUSD: number;
//   date: string;
//   status: StatusType;
//   returnRate: string;
//   isPositive: boolean;
//   notes?: string | null;
// }

// export interface CumulativeHolding {
//   key: string;
//   name: string;
//   tickerOrSymbol?: string | null;
//   assetClass: AssetType;
//   region: RegionType;
//   currency: CurrencyType;
//   totalShares: number;

//   // --- CONTRIBUTION (COST BASIS) ---
//   totalContributed: number;
//   totalContributedUSD: number;
//   avgPricePerShare: number;

//   // --- MARKET VALUE ---
//   currentPricePerShare?: number;
//   currentValueUSD: number;
//   currentValueGHS: number;
//   unrealizedGainUSD: number;
//   unrealizedGainGHS: number;
//   returnPercentage: number;

//   // --- REALIZED METRICS ---
//   realizedGainUSD: number;
//   realizedGainGHS: number;
//   dividendIncomeUSD: number;
//   dividendIncomeGHS: number;

//   transactions: Investment[];
// }

// const COLORS = [
//   "#3B82F6",
//   "#10B981",
//   "#F59E0B",
//   "#8B5CF6",
//   "#EC4899",
//   "#6366F1",
//   "#14B8A6",
//   "#F97316",
// ];

// // Unified Finance API Helper
// async function fetchMarketPrice(
//   symbol: string,
//   region?: RegionType,
// ): Promise<number | null> {
//   const cleanSymbol = symbol.trim().toUpperCase();
//   if (!cleanSymbol) return null;

//   let proxyUrl = `/api/finance?symbol=${encodeURIComponent(cleanSymbol)}`;
//   if (region) {
//     proxyUrl += `&region=${encodeURIComponent(region)}`;
//   }

//   try {
//     const response = await fetch(proxyUrl);
//     if (!response.ok) {
//       console.warn(
//         `Price unavailable for ticker "${cleanSymbol}" (HTTP ${response.status})`,
//       );
//       return null;
//     }

//     const data = await response.json();
//     const result = data?.chart?.result?.[0];

//     if (result) {
//       const price =
//         result.meta?.regularMarketPrice ?? result.meta?.chartPreviousClose;
//       return typeof price === "number" ? price : null;
//     }
//     return null;
//   } catch (error) {
//     console.error(
//       `Failed to fetch live price for ticker "${cleanSymbol}":`,
//       error,
//     );
//     return null;
//   }
// }

// export default function PortfolioTracker() {
//   const router = useRouter();
//   const [investments, setInvestments] = useState<Investment[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
//   const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
//     null,
//   );
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [regionFilter, setRegionFilter] = useState<"ALL" | "USA" | "GHANA">(
//     "ALL",
//   );

//   const [selectedHoldingKey, setSelectedHoldingKey] = useState<string | null>(
//     null,
//   );

//   // --- LIVE MARKET PRICES STATE ---
//   const [livePrices, setLivePrices] = useState<Record<string, number>>({});
//   const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
//   const [lastUpdated, setLastUpdated] = useState<string | null>(null);

//   // --- REFRESH DATABASE DATA ---
//   const fetchDbData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await getInvestments();
//       if (res.success && res.data) {
//         const formatted: Investment[] = res.data.map((item) => ({
//           ...item,
//           date: toLocalDateString(item.date),
//         }));
//         setInvestments(formatted);
//       } else {
//         setError(res.error || "Failed to load investments.");
//       }
//     } catch {
//       setError("An unexpected error occurred while fetching data.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     let isMounted = true;
//     const load = async () => {
//       if (isMounted) {
//         await fetchDbData();
//       }
//     };
//     load();
//     return () => {
//       isMounted = false;
//     };
//   }, [fetchDbData]);

//   // Extract unique ticker items with region context
//   const uniqueHoldingItems = useMemo(() => {
//     const map = new Map<string, { ticker: string; region: RegionType }>();
//     investments.forEach((inv) => {
//       const ticker = (inv.tickerOrSymbol || "").trim().toUpperCase();
//       if (ticker) {
//         map.set(ticker, { ticker, region: inv.region });
//       }
//     });
//     return Array.from(map.values());
//   }, [investments]);

//   // --- FETCH REAL-TIME MARKET PRICES ---
//   const fetchMarketPrices = useCallback(
//     async (items: { ticker: string; region: RegionType }[]) => {
//       if (items.length === 0) return;

//       try {
//         const priceResults = await Promise.all(
//           items.map(async ({ ticker, region }) => {
//             const price = await fetchMarketPrice(ticker, region);
//             return { ticker, price };
//           }),
//         );

//         const updatedPrices: Record<string, number> = {};
//         priceResults.forEach(({ ticker, price }) => {
//           if (price !== null) {
//             updatedPrices[ticker] = price;
//           }
//         });

//         setLivePrices((prev) => ({ ...prev, ...updatedPrices }));
//         setLastUpdated(new Date().toLocaleTimeString());
//       } catch {
//         console.error("Error fetching market prices");
//       }
//     },
//     [],
//   );

//   useEffect(() => {
//     let ignore = false;

//     if (uniqueHoldingItems.length > 0) {
//       Promise.resolve().then(async () => {
//         if (ignore) return;
//         setIsLoadingPrices(true);
//         try {
//           await fetchMarketPrices(uniqueHoldingItems);
//         } finally {
//           if (!ignore) {
//             setIsLoadingPrices(false);
//           }
//         }
//       });
//     }

//     return () => {
//       ignore = true;
//     };
//   }, [uniqueHoldingItems, fetchMarketPrices]);

//   const handleFullRefresh = async () => {
//     await fetchDbData();
//     if (uniqueHoldingItems.length > 0) {
//       setIsLoadingPrices(true);
//       await fetchMarketPrices(uniqueHoldingItems);
//     }
//   };

//   // --- FILTERED RAW DATA ---
//   const filteredInvestments = useMemo(() => {
//     if (regionFilter === "ALL") return investments;
//     return investments.filter((i) => i.region === regionFilter);
//   }, [investments, regionFilter]);

//   // --- CUMULATIVE HOLDINGS & REALIZED PERFORMANCE METRICS ---
//   const cumulativeHoldings = useMemo(() => {
//     const map = new Map<string, CumulativeHolding>();

//     filteredInvestments.forEach((inv) => {
//       const groupKey = (inv.tickerOrSymbol || inv.name).trim().toUpperCase();

//       const shares = inv.shares || 0;
//       const amount = inv.amount || 0;
//       const amountUSD = inv.amountUSD || 0;

//       const isBuy = inv.type === TransactionType.BUY;
//       const isSell = inv.type === TransactionType.SELL;
//       const isDividend =
//         inv.type === TransactionType.DRIP || inv.type === TransactionType.CASH;

//       if (!map.has(groupKey)) {
//         map.set(groupKey, {
//           key: groupKey,
//           name: inv.name,
//           tickerOrSymbol: inv.tickerOrSymbol,
//           assetClass: inv.assetClass,
//           region: inv.region,
//           currency: inv.currency,
//           totalShares: isBuy ? shares : isSell ? -shares : 0,
//           totalContributed: isBuy ? amount : 0,
//           totalContributedUSD: isBuy ? amountUSD : 0,
//           avgPricePerShare: 0,
//           currentValueUSD: 0,
//           currentValueGHS: 0,
//           unrealizedGainUSD: 0,
//           unrealizedGainGHS: 0,
//           returnPercentage: 0,
//           realizedGainUSD: isSell ? amountUSD : 0,
//           realizedGainGHS: isSell ? amount : 0,
//           dividendIncomeUSD: isDividend ? amountUSD : 0,
//           dividendIncomeGHS: isDividend ? amount : 0,
//           transactions: [inv],
//         });
//       } else {
//         const existing = map.get(groupKey)!;
//         if (isBuy) {
//           existing.totalShares += shares;
//           existing.totalContributed += amount;
//           existing.totalContributedUSD += amountUSD;
//         } else if (isSell) {
//           existing.totalShares -= shares;
//           existing.realizedGainUSD += amountUSD;
//           existing.realizedGainGHS += amount;
//         } else if (isDividend) {
//           existing.dividendIncomeUSD += amountUSD;
//           existing.dividendIncomeGHS += amount;
//         }
//         existing.transactions.push(inv);
//       }
//     });

//     return Array.from(map.values())
//       .filter((holding) => holding.totalShares > 0)
//       .map((holding) => {
//         const avgPrice =
//           holding.totalShares > 0
//             ? holding.totalContributed / holding.totalShares
//             : 0;

//         const ticker = (holding.tickerOrSymbol || "").trim().toUpperCase();
//         const currentPrice = livePrices[ticker] ?? avgPrice;

//         const isGhanaAsset =
//           holding.region === RegionType.GHANA ||
//           holding.currency === CurrencyType.GHS;

//         const fxRate =
//           holding.totalContributed > 0
//             ? holding.totalContributedUSD / holding.totalContributed
//             : 1;

//         const currentValueUSD = isGhanaAsset
//           ? holding.totalShares * currentPrice * fxRate
//           : holding.totalShares * currentPrice;

//         const currentValueGHS = isGhanaAsset
//           ? holding.totalShares * currentPrice
//           : fxRate > 0
//             ? (holding.totalShares * currentPrice) / fxRate
//             : 0;

//         const unrealizedGainUSD = currentValueUSD - holding.totalContributedUSD;
//         const unrealizedGainGHS = currentValueGHS - holding.totalContributed;

//         const returnPercentage =
//           holding.totalContributedUSD > 0
//             ? (unrealizedGainUSD / holding.totalContributedUSD) * 100
//             : 0;

//         return {
//           ...holding,
//           avgPricePerShare: avgPrice,
//           currentPricePerShare: currentPrice,
//           currentValueUSD,
//           currentValueGHS,
//           unrealizedGainUSD,
//           unrealizedGainGHS,
//           returnPercentage,
//         };
//       });
//   }, [filteredInvestments, livePrices]);

//   // --- EXTENDED PORTFOLIO STATS (CAGR, REALIZED GAINS, FX METRICS) ---
//   const portfolioStats = useMemo(() => {
//     const isGhanaFilter = regionFilter === "GHANA";

//     const totalContributed = cumulativeHoldings.reduce(
//       (acc, curr) =>
//         acc +
//         (isGhanaFilter ? curr.totalContributed : curr.totalContributedUSD),
//       0,
//     );

//     const totalMarketValue = cumulativeHoldings.reduce(
//       (acc, curr) =>
//         acc + (isGhanaFilter ? curr.currentValueGHS : curr.currentValueUSD),
//       0,
//     );

//     const totalRealized = cumulativeHoldings.reduce(
//       (acc, curr) =>
//         acc + (isGhanaFilter ? curr.realizedGainGHS : curr.realizedGainUSD),
//       0,
//     );

//     const totalDividends = cumulativeHoldings.reduce(
//       (acc, curr) =>
//         acc + (isGhanaFilter ? curr.dividendIncomeGHS : curr.dividendIncomeUSD),
//       0,
//     );

//     const totalGain = totalMarketValue - totalContributed;
//     const totalReturnPercent =
//       totalContributed > 0 ? (totalGain / totalContributed) * 100 : 0;

//     // CAGR Calculation Estimate based on oldest investment date
//     let cagr = 0;
//     if (investments.length > 0 && totalContributed > 0) {
//       const dates = investments.map((inv) => new Date(inv.date).getTime());
//       const oldestDate = Math.min(...dates);
//       const yearsElapsed = Math.max(
//         (new Date().getTime() - oldestDate) / (1000 * 60 * 60 * 24 * 365),
//         0.1,
//       );

//       cagr =
//         (Math.pow(totalMarketValue / totalContributed, 1 / yearsElapsed) - 1) *
//         100;
//     }

//     return {
//       totalContributed,
//       totalMarketValue,
//       totalGain,
//       totalReturnPercent,
//       totalRealized,
//       totalDividends,
//       cagr: isNaN(cagr) ? 0 : cagr,
//       currencySymbol: isGhanaFilter ? "GH" : "$",
//     };
//   }, [cumulativeHoldings, regionFilter, investments]);

//   const selectedHolding = useMemo(() => {
//     if (!selectedHoldingKey) return null;
//     return cumulativeHoldings.find((h) => h.key === selectedHoldingKey) || null;
//   }, [cumulativeHoldings, selectedHoldingKey]);

//   // Regional breakdown
//   const usTotalUSD = useMemo(() => {
//     return investments
//       .filter((h) => h.region === RegionType.USA)
//       .reduce((acc, curr) => acc + curr.amountUSD, 0);
//   }, [investments]);

//   const ghanaTotalUSD = useMemo(() => {
//     return investments
//       .filter((h) => h.region === RegionType.GHANA)
//       .reduce((acc, curr) => acc + curr.amountUSD, 0);
//   }, [investments]);

//   // Handlers
//   const handleAddInvestment = (newInv: Investment) => {
//     setInvestments((prev) => [newInv, ...prev]);
//     router.refresh();
//   };

//   const handleUpdateInvestment = (updatedInv: Investment) => {
//     setInvestments((prev) =>
//       prev.map((item) => (item.id === updatedInv.id ? updatedInv : item)),
//     );
//     router.refresh();
//   };

//   const handleDeleteInvestment = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this transaction entry?"))
//       return;

//     setDeletingId(id);
//     const res = await deleteInvestment(id);
//     if (res.success) {
//       setInvestments((prev) => prev.filter((item) => item.id !== id));
//       router.refresh();
//     } else {
//       alert(res.error || "Failed to delete item.");
//     }
//     setDeletingId(null);
//   };

//   // --- CHART DATA GENERATION ---
//   const tickerAllocationData = useMemo(() => {
//     const map = new Map<string, number>();
//     cumulativeHoldings.forEach((item) => {
//       const label = item.tickerOrSymbol
//         ? item.tickerOrSymbol.trim().toUpperCase()
//         : item.name;

//       const current = map.get(label) || 0;
//       const value =
//         regionFilter === "GHANA" ? item.currentValueGHS : item.currentValueUSD;
//       map.set(label, current + value);
//     });

//     return Array.from(map.entries())
//       .map(([name, value]) => ({ name, value }))
//       .filter((item) => item.value > 0);
//   }, [cumulativeHoldings, regionFilter]);

//   const assetClassAllocationData = useMemo(() => {
//     const map = new Map<string, number>();
//     cumulativeHoldings.forEach((item) => {
//       const label = item.assetClass;
//       const current = map.get(label) || 0;
//       const value =
//         regionFilter === "GHANA" ? item.currentValueGHS : item.currentValueUSD;
//       map.set(label, current + value);
//     });

//     return Array.from(map.entries())
//       .map(([name, value]) => ({ name, value }))
//       .filter((item) => item.value > 0);
//   }, [cumulativeHoldings, regionFilter]);

//   const assetPerformanceData = useMemo(() => {
//     return cumulativeHoldings.map((item) => ({
//       name: item.tickerOrSymbol || item.name,
//       returnPct: parseFloat(item.returnPercentage.toFixed(2)),
//       gain:
//         regionFilter === "GHANA"
//           ? item.unrealizedGainGHS
//           : item.unrealizedGainUSD,
//     }));
//   }, [cumulativeHoldings, regionFilter]);

//   return (
//     <div className="min-h-screen text-slate-100 p-3 md:p-5 font-sans">
//       <div className="max-w-7xl mx-auto space-y-4">
//         {/* HEADER */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
//           <div>
//             <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
//               <Briefcase className="w-6 h-6 text-blue-500" />
//               My Portfolio Tracker
//             </h1>
//             {lastUpdated && (
//               <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
//                 <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Live
//                 Market Prices Updated: {lastUpdated}
//               </span>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleFullRefresh}
//               disabled={loading || isLoadingPrices}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors disabled:opacity-50"
//               title="Refresh Data & Live Prices"
//             >
//               <RefreshCw
//                 className={`w-3.5 h-3.5 ${loading || isLoadingPrices ? "animate-spin text-blue-400" : ""}`}
//               />
//               <span>{isLoadingPrices ? "Fetching Prices..." : "Refresh"}</span>
//             </button>
//             <button
//               onClick={() => setIsAddModalOpen(true)}
//               className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-md shadow-blue-600/20"
//             >
//               <Plus className="w-4 h-4" />
//               Add Investment
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
//             <AlertCircle className="w-4 h-4 text-rose-400" />
//             {error}
//           </div>
//         )}

//         {/* METRICS DASHBOARD */}
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Total Contributed</span>
//               <DollarSign className="w-4 h-4 text-slate-400" />
//             </div>
//             <div className="text-xl font-bold text-white">
//               {portfolioStats.currencySymbol}
//               {portfolioStats.totalContributed.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Market Value</span>
//               <DollarSign className="w-4 h-4 text-blue-400" />
//             </div>
//             <div className="text-xl font-bold text-blue-400">
//               {portfolioStats.currencySymbol}
//               {portfolioStats.totalMarketValue.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Unrealized Gain</span>
//               <span
//                 className={`text-xs font-bold ${portfolioStats.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
//               >
//                 {portfolioStats.totalReturnPercent.toFixed(2)}%
//               </span>
//             </div>
//             <div
//               className={`text-xl font-bold ${portfolioStats.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
//             >
//               {portfolioStats.totalGain >= 0 ? "+" : ""}
//               {portfolioStats.currencySymbol}
//               {portfolioStats.totalGain.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">CAGR (Annualized)</span>
//               <TrendingUp className="w-4 h-4 text-emerald-400" />
//             </div>
//             <div
//               className={`text-xl font-bold ${portfolioStats.cagr >= 0 ? "text-emerald-400" : "text-rose-400"}`}
//             >
//               {portfolioStats.cagr.toFixed(2)}%
//             </div>
//             <span className="text-[10px] text-slate-500">Est. Growth Rate</span>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur flex flex-col justify-between">
//             <div className="text-xs text-slate-400 font-medium flex justify-between items-center">
//               <span>Realized & Income</span>
//               <Globe className="w-3.5 h-3.5 text-amber-400" />
//             </div>
//             <div className="flex flex-col text-xs mt-1">
//               <span className="text-slate-300 font-semibold">
//                 Realized: {portfolioStats.currencySymbol}
//                 {portfolioStats.totalRealized.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//               <span className="text-amber-400 font-semibold">
//                 Dividends: {portfolioStats.currencySymbol}
//                 {portfolioStats.totalDividends.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* VISUALIZATION GRID: HOLDINGS ALLOCATION, ASSET CLASSES, AND PERFORMANCE CHART */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//           {/* Pie Chart: Asset Allocation */}
//           <div className="lg:col-span-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col h-80">
//             <div className="flex justify-between items-center mb-2">
//               <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
//                 <PieChartIcon className="w-3.5 h-3.5 text-blue-400" /> Ticker
//                 Allocation
//               </h2>
//               <div className="flex bg-slate-900/80 p-0.5 rounded-md border border-slate-700">
//                 {(["ALL", "USA", "GHANA"] as const).map((reg) => (
//                   <button
//                     key={reg}
//                     onClick={() => setRegionFilter(reg)}
//                     className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all ${
//                       regionFilter === reg
//                         ? "bg-blue-600 text-white shadow"
//                         : "text-slate-400 hover:text-slate-200"
//                     }`}
//                   >
//                     {reg === "ALL" ? "Global" : reg}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div className="flex-1 w-full flex items-center justify-center">
//               {tickerAllocationData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={tickerAllocationData}
//                       cx="50%"
//                       cy="45%"
//                       innerRadius={40}
//                       outerRadius={65}
//                       paddingAngle={3}
//                       dataKey="value"
//                     >
//                       {tickerAllocationData.map((_, index) => (
//                         <Cell
//                           key={`cell-${index}`}
//                           fill={COLORS[index % COLORS.length]}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       formatter={(value: ValueType | undefined) => [
//                         `${regionFilter === "GHANA" ? "GH" : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
//                         "Value",
//                       ]}
//                       contentStyle={{
//                         backgroundColor: "#0F172A",
//                         borderColor: "#334155",
//                         borderRadius: "6px",
//                         fontSize: "11px",
//                       }}
//                     />
//                     <Legend
//                       verticalAlign="bottom"
//                       height={24}
//                       wrapperStyle={{ fontSize: "10px" }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="text-slate-500 text-xs">
//                   No active holdings.
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Pie Chart: Asset Class Distribution */}
//           <div className="lg:col-span-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col h-80">
//             <h2 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
//               <PieChartIcon className="w-3.5 h-3.5 text-amber-400" /> Asset
//               Class Mix
//             </h2>
//             <div className="flex-1 w-full flex items-center justify-center">
//               {assetClassAllocationData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={assetClassAllocationData}
//                       cx="50%"
//                       cy="45%"
//                       innerRadius={40}
//                       outerRadius={65}
//                       paddingAngle={3}
//                       dataKey="value"
//                     >
//                       {assetClassAllocationData.map((_, index) => (
//                         <Cell
//                           key={`ac-cell-${index}`}
//                           fill={COLORS[(index + 3) % COLORS.length]}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       formatter={(value: ValueType | undefined) => [
//                         `${regionFilter === "GHANA" ? "GH" : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
//                         "Value",
//                       ]}
//                       contentStyle={{
//                         backgroundColor: "#0F172A",
//                         borderColor: "#334155",
//                         borderRadius: "6px",
//                         fontSize: "11px",
//                       }}
//                     />
//                     <Legend
//                       verticalAlign="bottom"
//                       height={24}
//                       wrapperStyle={{ fontSize: "10px" }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="text-slate-500 text-xs">
//                   No active holdings.
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Bar Chart: Best vs. Worst Performers */}
//           <div className="lg:col-span-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col h-80">
//             <h2 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
//               <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Return % by
//               Asset
//             </h2>
//             <div className="flex-1 w-full">
//               {assetPerformanceData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart
//                     data={assetPerformanceData}
//                     margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
//                   >
//                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//                     <XAxis
//                       dataKey="name"
//                       stroke="#94A3B8"
//                       tick={{ fontSize: 10 }}
//                       interval={0}
//                     />
//                     <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
//                     <Tooltip
//                       formatter={(val: ValueType | undefined) => [
//                         `${val}%`,
//                         "Return",
//                       ]}
//                       contentStyle={{
//                         backgroundColor: "#0F172A",
//                         borderColor: "#334155",
//                         borderRadius: "6px",
//                         fontSize: "11px",
//                       }}
//                     />
//                     <ReferenceLine y={0} stroke="#64748B" />
//                     <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
//                       {assetPerformanceData.map((entry, index) => (
//                         <Cell
//                           key={`bar-${index}`}
//                           fill={entry.returnPct >= 0 ? "#10B981" : "#F43F5E"}
//                         />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="text-slate-500 text-xs flex items-center justify-center h-full">
//                   No performance metrics yet.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* CUMULATIVE HOLDINGS TABLE */}
//         <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col">
//           <div className="p-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/40">
//             <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
//               <Layers className="w-4 h-4 text-blue-400" />
//               Cumulative Portfolio Holdings
//             </h2>
//             <span className="text-[11px] text-slate-400 font-mono">
//               {cumulativeHoldings.length} Active Holdings
//             </span>
//           </div>

//           <div className="overflow-y-auto overflow-x-auto">
//             {loading ? (
//               <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
//                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                 Loading holdings...
//               </div>
//             ) : cumulativeHoldings.length === 0 ? (
//               <div className="p-8 text-center text-slate-500 text-xs">
//                 No active holdings recorded yet.
//               </div>
//             ) : (
//               <table className="w-full text-left text-xs text-slate-300">
//                 <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-700/60">
//                   <tr>
//                     <th className="px-3 py-2.5">Asset</th>
//                     <th className="px-3 py-2.5">Type</th>
//                     <th className="px-3 py-2.5">Shares</th>
//                     <th className="px-3 py-2.5">Avg Cost vs Price</th>
//                     <th className="px-3 py-2.5">Contributed</th>
//                     <th className="px-3 py-2.5">Market Value</th>
//                     <th className="px-3 py-2.5">Gain / Loss</th>
//                     <th className="px-3 py-2.5 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-700/40">
//                   {cumulativeHoldings.map((holding) => {
//                     const ticker = (holding.tickerOrSymbol || "")
//                       .trim()
//                       .toUpperCase();
//                     const isLive = Boolean(livePrices[ticker]);

//                     const displayGHS = regionFilter === "GHANA";
//                     const currencySymbol = displayGHS ? "GH" : "$";

//                     const contributedVal = displayGHS
//                       ? holding.totalContributed
//                       : holding.totalContributedUSD;

//                     const marketVal = displayGHS
//                       ? holding.currentValueGHS
//                       : holding.currentValueUSD;

//                     const gainVal = displayGHS
//                       ? holding.unrealizedGainGHS
//                       : holding.unrealizedGainUSD;

//                     return (
//                       <tr
//                         key={holding.key}
//                         className="hover:bg-slate-700/20 transition-colors"
//                       >
//                         <td className="px-3 py-2.5">
//                           <div className="font-semibold text-white">
//                             {holding.name}
//                           </div>
//                           <div className="text-[10px] text-slate-400 font-mono">
//                             {holding.tickerOrSymbol || holding.assetClass}
//                           </div>
//                         </td>
//                         <td className="px-3 py-2.5">
//                           <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] border border-slate-700 text-slate-300 font-mono">
//                             {holding.assetClass}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2.5 text-slate-200 font-mono">
//                           {holding.totalShares.toLocaleString()}
//                         </td>
//                         <td className="px-3 py-2.5">
//                           <div className="text-slate-300">
//                             Avg: {currencySymbol}
//                             {holding.avgPricePerShare.toFixed(2)}
//                           </div>
//                           <div
//                             className={`text-[10px] font-semibold flex items-center gap-1 ${
//                               isLive ? "text-emerald-400" : "text-blue-400"
//                             }`}
//                           >
//                             Now: {currencySymbol}
//                             {holding.currentPricePerShare?.toFixed(2)}
//                             {isLive && (
//                               <span
//                                 className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
//                                 title="Live price fetched"
//                               />
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-3 py-2.5 font-mono text-slate-300">
//                           <div>
//                             {currencySymbol}
//                             {contributedVal.toLocaleString("en-US", {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             })}
//                           </div>
//                         </td>
//                         <td className="px-3 py-2.5 font-mono font-bold text-white">
//                           <div>
//                             {currencySymbol}
//                             {marketVal.toLocaleString("en-US", {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             })}
//                           </div>
//                         </td>
//                         <td className="px-3 py-2.5 font-mono font-semibold">
//                           <span
//                             className={
//                               gainVal >= 0
//                                 ? "text-emerald-400"
//                                 : "text-rose-400"
//                             }
//                           >
//                             {gainVal >= 0 ? "+" : ""}
//                             {currencySymbol}
//                             {gainVal.toLocaleString("en-US", {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             })}
//                             <span className="text-[10px] block">
//                               ({holding.returnPercentage.toFixed(2)}%)
//                             </span>
//                           </span>
//                         </td>
//                         <td className="px-3 py-2.5 text-right">
//                           <button
//                             onClick={() => setSelectedHoldingKey(holding.key)}
//                             className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px]"
//                           >
//                             <History className="w-3 h-3" /> Log (
//                             {holding.transactions.length})
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* INDIVIDUAL TRANSACTIONS POPUP */}
//       {selectedHolding && (
//         <TransactionsHistoryModal
//           holding={selectedHolding}
//           onClose={() => setSelectedHoldingKey(null)}
//           onEdit={(tx) => setEditingInvestment(tx)}
//           onDelete={handleDeleteInvestment}
//           deletingId={deletingId}
//         />
//       )}

//       {/* ADD MODAL */}
//       {isAddModalOpen && (
//         <AddInvestmentModal
//           onClose={() => setIsAddModalOpen(false)}
//           onAdd={handleAddInvestment}
//         />
//       )}

//       {/* EDIT MODAL */}
//       {editingInvestment && (
//         <EditInvestmentModal
//           investment={editingInvestment}
//           onClose={() => setEditingInvestment(null)}
//           onUpdate={handleUpdateInvestment}
//         />
//       )}
//     </div>
//   );
// }

// // Modal implementations
// function TransactionsHistoryModal({
//   holding,
//   onClose,
//   onEdit,
//   onDelete,
//   deletingId,
// }: {
//   holding: CumulativeHolding;
//   onClose: () => void;
//   onEdit: (tx: Investment) => void;
//   onDelete: (id: string) => void;
//   deletingId: string | null;
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
//       <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
//         <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
//           <div>
//             <h3 className="text-base font-bold text-white flex items-center gap-2">
//               <span>{holding.name}</span>
//               {holding.tickerOrSymbol && (
//                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
//                   {holding.tickerOrSymbol}
//                 </span>
//               )}
//             </h3>
//             <p className="text-[11px] text-slate-400">
//               Transaction History Logs
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 overflow-y-auto flex-1">
//           <table className="w-full text-left text-xs text-slate-300">
//             <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0">
//               <tr>
//                 <th className="px-3 py-2 rounded-l-lg">Date</th>
//                 <th className="px-3 py-2">Type</th>
//                 <th className="px-3 py-2">Shares / Price</th>
//                 <th className="px-3 py-2">Amount</th>
//                 <th className="px-3 py-2">USD Amount</th>
//                 <th className="px-3 py-2 text-right rounded-r-lg">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-800">
//               {holding.transactions.map((tx) => (
//                 <tr key={tx.id} className="hover:bg-slate-800/40">
//                   <td className="px-3 py-2.5 font-mono text-slate-300">
//                     {new Date(tx.date)
//                       .toLocaleDateString("en-US", {
//                         timeZone: "UTC",
//                         month: "short",
//                         day: "2-digit",
//                         year: "2-digit",
//                       })
//                       .replace(",", "")
//                       .replace(/ /g, "-")}
//                   </td>
//                   <td className="px-3 py-2.5">
//                     <span
//                       className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
//                         tx.type === TransactionType.BUY
//                           ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
//                           : tx.type === TransactionType.SELL
//                             ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
//                             : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
//                       }`}
//                     >
//                       {tx.type}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2.5">
//                     {tx.shares ? (
//                       <div>
//                         {tx.shares} @{" "}
//                         {tx.currency === CurrencyType.USD ? "$" : "GH"}
//                         {tx.pricePerShare}
//                       </div>
//                     ) : (
//                       <span className="text-slate-500">—</span>
//                     )}
//                   </td>
//                   <td className="px-3 py-2.5 font-mono">
//                     {tx.currency === CurrencyType.USD ? "$" : "GH"}
//                     {tx.amount.toLocaleString()}
//                   </td>
//                   <td className="px-3 py-2.5 font-mono font-semibold text-white">
//                     $
//                     {tx.amountUSD.toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                     })}
//                   </td>
//                   <td className="px-3 py-2.5 text-right">
//                     <div className="flex items-center justify-end gap-1.5">
//                       <button
//                         onClick={() => onEdit(tx)}
//                         className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
//                         title="Edit entry"
//                       >
//                         <Pencil className="w-3.5 h-3.5" />
//                       </button>
//                       <button
//                         onClick={() => onDelete(tx.id)}
//                         disabled={deletingId === tx.id}
//                         className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
//                         title="Delete entry"
//                       >
//                         {deletingId === tx.id ? (
//                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
//                         ) : (
//                           <Trash2 className="w-3.5 h-3.5" />
//                         )}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// interface InvestmentFormData {
//   name: string;
//   tickerOrSymbol: string;
//   assetClass: AssetType;
//   region: RegionType;
//   currency: CurrencyType;
//   type: TransactionType;
//   shares: string;
//   pricePerShare: string;
//   amount: string;
//   exchangeRate: string;
//   date: string;
//   notes: string;
// }

// function AddInvestmentModal({
//   onClose,
//   onAdd,
// }: {
//   onClose: () => void;
//   onAdd: (investment: Investment) => void;
// }) {
//   const [formData, setFormData] = useState<InvestmentFormData>({
//     name: "",
//     tickerOrSymbol: "",
//     assetClass: AssetType.ETF,
//     region: RegionType.USA,
//     currency: CurrencyType.USD,
//     type: TransactionType.BUY,
//     shares: "",
//     pricePerShare: "",
//     amount: "",
//     exchangeRate: "1.0",
//     date: toLocalDateString(new Date()),
//     notes: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const handleSharesChange = (val: string) => {
//     setFormData((prev) => {
//       const s = parseFloat(val);
//       const p = parseFloat(prev.pricePerShare);
//       const computedAmount =
//         !isNaN(s) && !isNaN(p) && s > 0 && p > 0
//           ? (s * p).toFixed(2)
//           : prev.amount;
//       return { ...prev, shares: val, amount: computedAmount };
//     });
//   };

//   const handlePriceChange = (val: string) => {
//     setFormData((prev) => {
//       const s = parseFloat(prev.shares);
//       const p = parseFloat(val);
//       const computedAmount =
//         !isNaN(s) && !isNaN(p) && s > 0 && p > 0
//           ? (s * p).toFixed(2)
//           : prev.amount;
//       return { ...prev, pricePerShare: val, amount: computedAmount };
//     });
//   };

//   const handleRegionChange = (region: RegionType) => {
//     const currency: CurrencyType =
//       region === RegionType.USA ? CurrencyType.USD : CurrencyType.GHS;
//     const exchangeRate = region === RegionType.USA ? "1.0" : "0.086";
//     setFormData((prev) => ({ ...prev, region, currency, exchangeRate }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setSubmitError(null);

//     const amountVal = parseFloat(formData.amount) || 0;
//     const exRateVal = parseFloat(formData.exchangeRate) || 1.0;

//     const selectedDate = formData.date
//       ? new Date(`${formData.date}T00:00:00.000Z`)
//       : new Date();

//     const payload = {
//       name: formData.name,
//       tickerOrSymbol: formData.tickerOrSymbol || null,
//       assetClass: formData.assetClass,
//       region: formData.region,
//       currency: formData.currency,
//       type: formData.type,
//       shares: formData.shares ? parseFloat(formData.shares) : null,
//       pricePerShare: formData.pricePerShare
//         ? parseFloat(formData.pricePerShare)
//         : null,
//       amount: amountVal,
//       exchangeRate: exRateVal,
//       amountUSD:
//         formData.currency === CurrencyType.USD
//           ? amountVal
//           : amountVal * exRateVal,
//       date: selectedDate,
//       status: StatusType.ACTIVE,
//       returnRate: "0%",
//       isPositive: true,
//       notes: formData.notes || null,
//     };

//     const res = await createInvestment(payload);
//     if (res.success && res.data) {
//       const formatted: Investment = {
//         ...res.data,
//         date: toLocalDateString(res.data.date),
//       };
//       onAdd(formatted);
//       onClose();
//     } else {
//       setSubmitError(res.error || "Failed to create investment.");
//     }
//     setIsSubmitting(false);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
//       <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
//         <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
//           <h3 className="text-sm font-bold text-white flex items-center gap-2">
//             <Plus className="w-4 h-4 text-blue-500" />
//             Add New Investment Transaction
//           </h3>
//           <button
//             onClick={onClose}
//             className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
//           {submitError && (
//             <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
//               {submitError}
//             </div>
//           )}

//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Asset Name *</label>
//               <input
//                 type="text"
//                 required
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, name: e.target.value }))
//                 }
//                 placeholder="e.g. Scancom PLC (MTN)"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">
//                 Ticker / Symbol
//               </label>
//               <input
//                 type="text"
//                 value={formData.tickerOrSymbol}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     tickerOrSymbol: e.target.value,
//                   }))
//                 }
//                 placeholder="e.g. MTNGH"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Type</label>
//               <select
//                 value={formData.type}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     type: e.target.value as TransactionType,
//                   }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value={TransactionType.BUY}>BUY</option>
//                 <option value={TransactionType.SELL}>SELL</option>
//                 <option value={TransactionType.DRIP}>DRIP</option>
//                 <option value={TransactionType.CASH}>CASH</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Region</label>
//               <select
//                 value={formData.region}
//                 onChange={(e) =>
//                   handleRegionChange(e.target.value as RegionType)
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value={RegionType.USA}>USA (USD)</option>
//                 <option value={RegionType.GHANA}>Ghana (GHS)</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Asset Class</label>
//               <select
//                 value={formData.assetClass}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     assetClass: e.target.value as AssetType,
//                   }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 {Object.values(AssetType).map((ac) => (
//                   <option key={ac} value={ac}>
//                     {ac}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Shares</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={formData.shares}
//                 onChange={(e) => handleSharesChange(e.target.value)}
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Price / Share</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={formData.pricePerShare}
//                 onChange={(e) => handlePriceChange(e.target.value)}
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">
//                 Total Amount *
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 required
//                 value={formData.amount}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, amount: e.target.value }))
//                 }
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Date *</label>
//               <input
//                 type="date"
//                 required
//                 value={formData.date}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, date: e.target.value }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               />
//             </div>
//             {formData.currency === CurrencyType.GHS && (
//               <div>
//                 <label className="block text-slate-400 mb-1">
//                   FX Rate (GHS to USD)
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   value={formData.exchangeRate}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       exchangeRate: e.target.value,
//                     }))
//                   }
//                   className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//                 />
//               </div>
//             )}
//           </div>

//           <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
//             >
//               {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
//               Save Investment
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function EditInvestmentModal({
//   investment,
//   onClose,
//   onUpdate,
// }: {
//   investment: Investment;
//   onClose: () => void;
//   onUpdate: (investment: Investment) => void;
// }) {
//   const [formData, setFormData] = useState<InvestmentFormData>({
//     name: investment.name,
//     tickerOrSymbol: investment.tickerOrSymbol || "",
//     assetClass: investment.assetClass,
//     region: investment.region,
//     currency: investment.currency,
//     type: investment.type,
//     shares: investment.shares ? investment.shares.toString() : "",
//     pricePerShare: investment.pricePerShare
//       ? investment.pricePerShare.toString()
//       : "",
//     amount: investment.amount.toString(),
//     exchangeRate: investment.exchangeRate.toString(),
//     date: investment.date,
//     notes: investment.notes || "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const handleSharesChange = (val: string) => {
//     setFormData((prev) => {
//       const s = parseFloat(val);
//       const p = parseFloat(prev.pricePerShare);
//       const computedAmount =
//         !isNaN(s) && !isNaN(p) && s > 0 && p > 0
//           ? (s * p).toFixed(2)
//           : prev.amount;
//       return { ...prev, shares: val, amount: computedAmount };
//     });
//   };

//   const handlePriceChange = (val: string) => {
//     setFormData((prev) => {
//       const s = parseFloat(prev.shares);
//       const p = parseFloat(val);
//       const computedAmount =
//         !isNaN(s) && !isNaN(p) && s > 0 && p > 0
//           ? (s * p).toFixed(2)
//           : prev.amount;
//       return { ...prev, pricePerShare: val, amount: computedAmount };
//     });
//   };

//   const handleRegionChange = (region: RegionType) => {
//     const currency: CurrencyType =
//       region === RegionType.USA ? CurrencyType.USD : CurrencyType.GHS;
//     const exchangeRate = region === RegionType.USA ? "1.0" : "0.086";
//     setFormData((prev) => ({ ...prev, region, currency, exchangeRate }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setSubmitError(null);

//     const amountVal = parseFloat(formData.amount) || 0;
//     const exRateVal = parseFloat(formData.exchangeRate) || 1.0;

//     const selectedDate = new Date(`${formData.date}T00:00:00.000Z`);

//     const payload = {
//       name: formData.name,
//       tickerOrSymbol: formData.tickerOrSymbol || null,
//       assetClass: formData.assetClass,
//       region: formData.region,
//       currency: formData.currency,
//       type: formData.type,
//       shares: formData.shares ? parseFloat(formData.shares) : null,
//       pricePerShare: formData.pricePerShare
//         ? parseFloat(formData.pricePerShare)
//         : null,
//       amount: amountVal,
//       exchangeRate: exRateVal,
//       amountUSD:
//         formData.currency === CurrencyType.USD
//           ? amountVal
//           : amountVal * exRateVal,
//       date: selectedDate,
//       notes: formData.notes || null,
//     };

//     const res = await updateInvestment(investment.id, payload);
//     if (res.success && res.data) {
//       const formatted: Investment = {
//         ...res.data,
//         date: toLocalDateString(res.data.date),
//       };
//       onUpdate(formatted);
//       onClose();
//     } else {
//       setSubmitError(res.error || "Failed to update investment.");
//     }
//     setIsSubmitting(false);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
//       <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
//         <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
//           <h3 className="text-sm font-bold text-white flex items-center gap-2">
//             <Pencil className="w-4 h-4 text-blue-500" />
//             Edit Investment Transaction
//           </h3>
//           <button
//             onClick={onClose}
//             className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
//           {submitError && (
//             <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
//               {submitError}
//             </div>
//           )}

//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Asset Name *</label>
//               <input
//                 type="text"
//                 required
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, name: e.target.value }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">
//                 Ticker / Symbol
//               </label>
//               <input
//                 type="text"
//                 value={formData.tickerOrSymbol}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     tickerOrSymbol: e.target.value,
//                   }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Type</label>
//               <select
//                 value={formData.type}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     type: e.target.value as TransactionType,
//                   }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value={TransactionType.BUY}>BUY</option>
//                 <option value={TransactionType.SELL}>SELL</option>
//                 <option value={TransactionType.DRIP}>DRIP</option>
//                 <option value={TransactionType.CASH}>CASH</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Region</label>
//               <select
//                 value={formData.region}
//                 onChange={(e) =>
//                   handleRegionChange(e.target.value as RegionType)
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value={RegionType.USA}>USA (USD)</option>
//                 <option value={RegionType.GHANA}>Ghana (GHS)</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Asset Class</label>
//               <select
//                 value={formData.assetClass}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     assetClass: e.target.value as AssetType,
//                   }))
//                 }
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 {Object.values(AssetType).map((ac) => (
//                   <option key={ac} value={ac}>
//                     {ac}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-slate-400 mb-1">Shares</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={formData.shares}
//                 onChange={(e) => handleSharesChange(e.target.value)}
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">Price / Share</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={formData.pricePerShare}
//                 onChange={(e) => handlePriceChange(e.target.value)}
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-400 mb-1">
//                 Total Amount *
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 required
//                 value={formData.amount}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, amount: e.target.value }))
//                 }
//                 placeholder="0.00"
//                 className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block text-slate-400 mb-1">Date *</label>
//             <input
//               type="date"
//               required
//               value={formData.date}
//               onChange={(e) =>
//                 setFormData((prev) => ({ ...prev, date: e.target.value }))
//               }
//               className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>

//           <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
//             >
//               {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
//               Update Investment
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
