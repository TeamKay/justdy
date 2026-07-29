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
  CheckCircle2,
  AlertCircle,
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
  totalContributed: number; // Raw native amount (GHS or USD depending on region)
  totalContributedUSD: number;
  avgPricePerShare: number;

  // --- MARKET VALUE ---
  currentPricePerShare?: number;
  currentValueUSD: number;
  currentValueGHS: number;
  unrealizedGainUSD: number;
  unrealizedGainGHS: number;
  returnPercentage: number;

  transactions: Investment[];
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
];

// ==========================================
// UNIFIED FINANCE API HELPER (US & GHANA)
// ==========================================
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
    if (!response.ok) {
      console.warn(
        `Price unavailable for ticker "${cleanSymbol}" (HTTP ${response.status})`,
      );
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (result) {
      const price =
        result.meta?.regularMarketPrice ?? result.meta?.chartPreviousClose;
      return typeof price === "number" ? price : null;
    }
    return null;
  } catch (error) {
    console.error(
      `Failed to fetch live price for ticker "${cleanSymbol}":`,
      error,
    );
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
      if (isMounted) {
        await fetchDbData();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchDbData]);

  // Extract unique ticker items with region context
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

  // --- FETCH REAL-TIME MARKET PRICES (USA + GHANA) ---
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

  // Trigger live price updates when uniqueHoldingItems change
  useEffect(() => {
    let ignore = false;

    if (uniqueHoldingItems.length > 0) {
      Promise.resolve().then(async () => {
        if (ignore) return;
        setIsLoadingPrices(true);
        try {
          await fetchMarketPrices(uniqueHoldingItems);
        } finally {
          if (!ignore) {
            setIsLoadingPrices(false);
          }
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [uniqueHoldingItems, fetchMarketPrices]);

  // Combined Refresh Handler for both DB and Live Market Prices
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

  // --- CUMULATIVE HOLDINGS WITH LIVE MARKET VALUES ---
  // --- CUMULATIVE HOLDINGS WITH LIVE MARKET VALUES ---
  const cumulativeHoldings = useMemo(() => {
    const map = new Map<string, CumulativeHolding>();

    filteredInvestments.forEach((inv) => {
      const groupKey = (inv.tickerOrSymbol || inv.name).trim().toUpperCase();

      const shares = inv.shares || 0;
      const amount = inv.amount || 0;
      const amountUSD = inv.amountUSD || 0;

      const isBuy = inv.type === TransactionType.BUY;
      const sharesModifier = isBuy ? shares : -shares;
      const amountModifier = isBuy ? amount : -amount;
      const amountUSDModifier = isBuy ? amountUSD : -amountUSD;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          name: inv.name,
          tickerOrSymbol: inv.tickerOrSymbol,
          assetClass: inv.assetClass,
          region: inv.region,
          currency: inv.currency,
          totalShares: sharesModifier,
          totalContributed: amountModifier,
          totalContributedUSD: amountUSDModifier,
          avgPricePerShare: 0,
          currentValueUSD: 0,
          currentValueGHS: 0,
          unrealizedGainUSD: 0,
          unrealizedGainGHS: 0,
          returnPercentage: 0,
          transactions: [inv],
        });
      } else {
        const existing = map.get(groupKey)!;
        existing.totalShares += sharesModifier;
        existing.totalContributed += amountModifier;
        existing.totalContributedUSD += amountUSDModifier;
        existing.transactions.push(inv);
      }
    });

    return (
      Array.from(map.values())
        // 1. Filter out zero or negative share holdings
        .filter((holding) => holding.totalShares > 0)
        // 2. Map market prices and calculations
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

          // Dollar & Cedi Calculations
          const currentValueUSD = isGhanaAsset
            ? holding.totalShares * currentPrice * fxRate
            : holding.totalShares * currentPrice;

          const currentValueGHS = isGhanaAsset
            ? holding.totalShares * currentPrice
            : fxRate > 0
              ? (holding.totalShares * currentPrice) / fxRate
              : 0;

          const unrealizedGainUSD =
            currentValueUSD - holding.totalContributedUSD;
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
        })
    );
  }, [filteredInvestments, livePrices]);

  // --- OVERALL PORTFOLIO METRICS BASED ON TOGGLE ---
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

    const totalGain = totalMarketValue - totalContributed;
    const totalReturnPercent =
      totalContributed > 0 ? (totalGain / totalContributed) * 100 : 0;

    return {
      totalContributed,
      totalMarketValue,
      totalGain,
      totalReturnPercent,
      currencySymbol: isGhanaFilter ? "GH" : "$",
    };
  }, [cumulativeHoldings, regionFilter]);

  const selectedHolding = useMemo(() => {
    if (!selectedHoldingKey) return null;
    return cumulativeHoldings.find((h) => h.key === selectedHoldingKey) || null;
  }, [cumulativeHoldings, selectedHoldingKey]);

  // --- STATS COMPUTATION BY REGION ---
  const usTotalUSD = useMemo(() => {
    return investments
      .filter((h) => h.region === RegionType.USA)
      .reduce((acc, curr) => acc + curr.amountUSD, 0);
  }, [investments]);

  const ghanaTotalUSD = useMemo(() => {
    return investments
      .filter((h) => h.region === RegionType.GHANA)
      .reduce((acc, curr) => acc + curr.amountUSD, 0);
  }, [investments]);

  // --- HANDLERS ---
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

  const tickerAllocationData = useMemo(() => {
    const map = new Map<string, number>();
    cumulativeHoldings.forEach((item) => {
      const label = item.tickerOrSymbol
        ? item.tickerOrSymbol.trim().toUpperCase()
        : item.name;

      const current = map.get(label) || 0;
      const value =
        regionFilter === "GHANA" ? item.currentValueGHS : item.currentValueUSD;
      map.set(label, current + value);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [cumulativeHoldings, regionFilter]);

  return (
    <div className="min-h-screen text-slate-100 p-3 md:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-500" />
              My Portfolio Tracker
            </h1>
            {lastUpdated && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Live
                Market Prices Updated: {lastUpdated}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFullRefresh}
              disabled={loading || isLoadingPrices}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors disabled:opacity-50"
              title="Refresh Data & Live Prices"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading || isLoadingPrices ? "animate-spin text-blue-400" : ""}`}
              />
              <span>{isLoadingPrices ? "Fetching Prices..." : "Refresh"}</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Investment
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            {error}
          </div>
        )}

        {/* METRICS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Contributed</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {portfolioStats.currencySymbol}
              {portfolioStats.totalContributed.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Current Market Value</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {portfolioStats.currencySymbol}
              {portfolioStats.totalMarketValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Return</span>
              <span
                className={`text-xs font-bold ${portfolioStats.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {portfolioStats.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${portfolioStats.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {portfolioStats.totalGain >= 0 ? "+" : ""}
              {portfolioStats.currencySymbol}
              {portfolioStats.totalGain.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur flex flex-col justify-between">
            <div className="text-xs text-slate-400 font-medium">
              Regional Market Value
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-blue-400 font-semibold">
                USA: $
                {usTotalUSD.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-amber-400 font-semibold">
                GHANA: $
                {ghanaTotalUSD.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* HORIZONTAL GRID: CHART & CUMULATIVE HOLDINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col h-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Allocation</h2>
              </div>

              <div className="flex bg-slate-900/80 p-0.5 rounded-md border border-slate-700">
                {(["ALL", "USA", "GHANA"] as const).map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setRegionFilter(reg)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                      regionFilter === reg
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {reg === "ALL" ? "Global" : reg}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Loading chart...
                </div>
              ) : tickerAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tickerAllocationData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tickerAllocationData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: ValueType | undefined) => [
                        `${regionFilter === "GHANA" ? "GH" : "$"}${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        "Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs">
                  No active holdings found.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-9 bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col h-100">
            <div className="p-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/40">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                Cumulative Holdings
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {cumulativeHoldings.length} Assets
              </span>
            </div>

            <div className="overflow-y-auto overflow-x-auto flex-1">
              {loading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Loading holdings...
                </div>
              ) : cumulativeHoldings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No holdings recorded yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-700/60">
                    <tr>
                      <th className="px-3 py-2.5">Asset</th>
                      <th className="px-3 py-2.5">Shares</th>
                      <th className="px-3 py-2.5">Avg Cost vs Price</th>
                      <th className="px-3 py-2.5">Contributed</th>
                      <th className="px-3 py-2.5">Market Value</th>
                      <th className="px-3 py-2.5">Gain / Loss</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {cumulativeHoldings.map((holding) => {
                      const ticker = (holding.tickerOrSymbol || "")
                        .trim()
                        .toUpperCase();
                      const isLive = Boolean(livePrices[ticker]);

                      const displayGHS = regionFilter === "GHANA";
                      const currencySymbol = displayGHS ? "GH" : "$";

                      const contributedVal = displayGHS
                        ? holding.totalContributed
                        : holding.totalContributedUSD;

                      const marketVal = displayGHS
                        ? holding.currentValueGHS
                        : holding.currentValueUSD;

                      const gainVal = displayGHS
                        ? holding.unrealizedGainGHS
                        : holding.unrealizedGainUSD;

                      return (
                        <tr
                          key={holding.key}
                          className="hover:bg-slate-700/20 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-white">
                              {holding.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {holding.tickerOrSymbol || holding.assetClass}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-200">
                            {holding.totalShares.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-slate-300">
                              Avg: {currencySymbol}
                              {holding.avgPricePerShare.toFixed(2)}
                            </div>
                            <div
                              className={`text-[10px] font-semibold flex items-center gap-1 ${
                                isLive ? "text-emerald-400" : "text-blue-400"
                              }`}
                            >
                              Now: {currencySymbol}
                              {holding.currentPricePerShare?.toFixed(2)}
                              {isLive && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                                  title="Live price fetched"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-300">
                            <div>
                              {currencySymbol}
                              {contributedVal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-white">
                            <div>
                              {currencySymbol}
                              {marketVal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold">
                            <span
                              className={
                                gainVal >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }
                            >
                              {gainVal >= 0 ? "+" : ""}
                              {currencySymbol}
                              {gainVal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              <span className="text-[10px] block">
                                ({holding.returnPercentage.toFixed(2)}%)
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => setSelectedHoldingKey(holding.key)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px]"
                            >
                              <History className="w-3 h-3" /> Log (
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
      </div>

      {/* INDIVIDUAL TRANSACTIONS POPUP / MODAL */}
      {selectedHolding && (
        <TransactionsHistoryModal
          holding={selectedHolding}
          onClose={() => setSelectedHoldingKey(null)}
          onEdit={(tx) => setEditingInvestment(tx)}
          onDelete={handleDeleteInvestment}
          deletingId={deletingId}
        />
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <AddInvestmentModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddInvestment}
        />
      )}

      {/* EDIT MODAL */}
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

// --- POPUP MODAL FOR INDIVIDUAL TRANSACTIONS ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{holding.name}</span>
              {holding.tickerOrSymbol && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {holding.tickerOrSymbol}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Individual Transaction Logs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-3 py-2 rounded-l-lg">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Shares / Price</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">USD Amount</th>
                <th className="px-3 py-2 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {holding.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-mono text-slate-300">
                    {new Date(tx.date)
                      .toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        month: "short",
                        day: "2-digit",
                        year: "2-digit",
                      })
                      .replace(",", "")
                      .replace(/ /g, "-")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === TransactionType.BUY
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {tx.shares ? (
                      <div>
                        {tx.shares} @{" "}
                        {tx.currency === CurrencyType.USD ? "$" : "GH"}
                        {tx.pricePerShare}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    {tx.currency === CurrencyType.USD ? "$" : "GH"}
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-white">
                    $
                    {tx.amountUSD.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors"
                        title="Edit entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
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

// --- ADD INVESTMENT MODAL ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Add New Investment Transaction
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {submitError && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Scancom PLC (MTN)"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Ticker / Symbol
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
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={TransactionType.BUY}>BUY</option>
                <option value={TransactionType.SELL}>SELL</option>
                <option value={TransactionType.DRIP}>DRIP</option>
                <option value={TransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Region</label>
              <select
                value={formData.region}
                onChange={(e) =>
                  handleRegionChange(e.target.value as RegionType)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={RegionType.USA}>USA (USD)</option>
                <option value={RegionType.GHANA}>Ghana (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Asset Class</label>
              <select
                value={formData.assetClass}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assetClass: e.target.value as AssetType,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 mb-1">Shares</label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Price / Share</label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
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
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {formData.currency === CurrencyType.GHS && (
              <div>
                <label className="block text-slate-400 mb-1">
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
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- EDIT INVESTMENT MODAL ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-500" />
            Edit Investment Transaction
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {submitError && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Ticker / Symbol
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
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={TransactionType.BUY}>BUY</option>
                <option value={TransactionType.SELL}>SELL</option>
                <option value={TransactionType.DRIP}>DRIP</option>
                <option value={TransactionType.CASH}>CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Region</label>
              <select
                value={formData.region}
                onChange={(e) =>
                  handleRegionChange(e.target.value as RegionType)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={RegionType.USA}>USA (USD)</option>
                <option value={RegionType.GHANA}>Ghana (GHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Asset Class</label>
              <select
                value={formData.assetClass}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assetClass: e.target.value as AssetType,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 mb-1">Shares</label>
              <input
                type="number"
                step="any"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Price / Share</label>
              <input
                type="number"
                step="any"
                value={formData.pricePerShare}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
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
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Update Investment
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

//   transactions: Investment[];
// }

// const COLORS = [
//   "#3B82F6",
//   "#10B981",
//   "#F59E0B",
//   "#8B5CF6",
//   "#EC4899",
//   "#6366F1",
// ];

// // ==========================================
// // UNIFIED FINANCE API HELPER (US & GHANA)
// // ==========================================
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

//   // --- FETCH REAL-TIME MARKET PRICES (USA + GHANA) ---
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

//   // Trigger live price updates when uniqueHoldingItems change
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

//   // Combined Refresh Handler for both DB and Live Market Prices
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

//   // --- CUMULATIVE HOLDINGS WITH LIVE MARKET VALUES ---
//   const cumulativeHoldings = useMemo(() => {
//     const map = new Map<string, CumulativeHolding>();

//     filteredInvestments.forEach((inv) => {
//       const groupKey = (inv.tickerOrSymbol || inv.name).trim().toUpperCase();

//       const shares = inv.shares || 0;
//       const amount = inv.amount || 0;
//       const amountUSD = inv.amountUSD || 0;

//       const isBuy = inv.type === TransactionType.BUY;
//       const sharesModifier = isBuy ? shares : -shares;
//       const amountModifier = isBuy ? amount : -amount;
//       const amountUSDModifier = isBuy ? amountUSD : -amountUSD;

//       if (!map.has(groupKey)) {
//         map.set(groupKey, {
//           key: groupKey,
//           name: inv.name,
//           tickerOrSymbol: inv.tickerOrSymbol,
//           assetClass: inv.assetClass,
//           region: inv.region,
//           currency: inv.currency,
//           totalShares: sharesModifier,
//           totalContributed: amountModifier,
//           totalContributedUSD: amountUSDModifier,
//           avgPricePerShare: 0,
//           currentValueUSD: 0,
//           currentValueGHS: 0,
//           unrealizedGainUSD: 0,
//           unrealizedGainGHS: 0,
//           returnPercentage: 0,
//           transactions: [inv],
//         });
//       } else {
//         const existing = map.get(groupKey)!;
//         existing.totalShares += sharesModifier;
//         existing.totalContributed += amountModifier;
//         existing.totalContributedUSD += amountUSDModifier;
//         existing.transactions.push(inv);
//       }
//     });

//     return Array.from(map.values()).map((holding) => {
//       const avgPrice =
//         holding.totalShares > 0
//           ? holding.totalContributed / holding.totalShares
//           : 0;

//       const ticker = (holding.tickerOrSymbol || "").trim().toUpperCase();
//       const currentPrice = livePrices[ticker] ?? avgPrice;

//       const fxRate =
//         holding.totalContributed > 0
//           ? holding.totalContributedUSD / holding.totalContributed
//           : 1;

//       // Dollar & Cedi Calculations
//       const currentValueUSD = holding.totalShares * currentPrice * fxRate;
//       const currentValueGHS = holding.totalShares * currentPrice;

//       const unrealizedGainUSD = currentValueUSD - holding.totalContributedUSD;
//       const unrealizedGainGHS = currentValueGHS - holding.totalContributed;

//       const returnPercentage =
//         holding.totalContributedUSD > 0
//           ? (unrealizedGainUSD / holding.totalContributedUSD) * 100
//           : 0;

//       return {
//         ...holding,
//         avgPricePerShare: avgPrice,
//         currentPricePerShare: currentPrice,
//         currentValueUSD,
//         currentValueGHS,
//         unrealizedGainUSD,
//         unrealizedGainGHS,
//         returnPercentage,
//       };
//     });
//   }, [filteredInvestments, livePrices]);

//   // --- OVERALL PORTFOLIO METRICS ---
//   const portfolioStats = useMemo(() => {
//     const totalContributedUSD = cumulativeHoldings.reduce(
//       (acc, curr) => acc + curr.totalContributedUSD,
//       0,
//     );
//     const totalMarketValueUSD = cumulativeHoldings.reduce(
//       (acc, curr) => acc + curr.currentValueUSD,
//       0,
//     );
//     const totalGainUSD = totalMarketValueUSD - totalContributedUSD;
//     const totalReturnPercent =
//       totalContributedUSD > 0 ? (totalGainUSD / totalContributedUSD) * 100 : 0;

//     return {
//       totalContributedUSD,
//       totalMarketValueUSD,
//       totalGainUSD,
//       totalReturnPercent,
//     };
//   }, [cumulativeHoldings]);

//   const selectedHolding = useMemo(() => {
//     if (!selectedHoldingKey) return null;
//     return cumulativeHoldings.find((h) => h.key === selectedHoldingKey) || null;
//   }, [cumulativeHoldings, selectedHoldingKey]);

//   // --- STATS COMPUTATION BY REGION ---
//   const usTotalUSD = useMemo(() => {
//     return cumulativeHoldings
//       .filter((h) => h.region === RegionType.USA)
//       .reduce((acc, curr) => acc + curr.currentValueUSD, 0);
//   }, [cumulativeHoldings]);

//   const ghanaTotalUSD = useMemo(() => {
//     return cumulativeHoldings
//       .filter((h) => h.region === RegionType.GHANA)
//       .reduce((acc, curr) => acc + curr.currentValueUSD, 0);
//   }, [cumulativeHoldings]);

//   // --- HANDLERS ---
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

//   const tickerAllocationData = useMemo(() => {
//     const map = new Map<string, number>();
//     cumulativeHoldings.forEach((item) => {
//       const label = item.tickerOrSymbol
//         ? item.tickerOrSymbol.trim().toUpperCase()
//         : item.name;

//       const current = map.get(label) || 0;
//       map.set(label, current + item.currentValueUSD);
//     });

//     return Array.from(map.entries())
//       .map(([name, value]) => ({ name, value }))
//       .filter((item) => item.value > 0);
//   }, [cumulativeHoldings]);

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
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Total Contributed</span>
//               <DollarSign className="w-4 h-4 text-slate-400" />
//             </div>
//             <div className="text-2xl font-bold text-white">
//               $
//               {portfolioStats.totalContributedUSD.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Current Market Value</span>
//               <DollarSign className="w-4 h-4 text-blue-400" />
//             </div>
//             <div className="text-2xl font-bold text-blue-400">
//               $
//               {portfolioStats.totalMarketValueUSD.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur">
//             <div className="flex items-center justify-between text-slate-400 mb-1">
//               <span className="text-xs font-medium">Total Return</span>
//               <span
//                 className={`text-xs font-bold ${portfolioStats.totalGainUSD >= 0 ? "text-emerald-400" : "text-rose-400"}`}
//               >
//                 {portfolioStats.totalReturnPercent.toFixed(2)}%
//               </span>
//             </div>
//             <div
//               className={`text-2xl font-bold ${portfolioStats.totalGainUSD >= 0 ? "text-emerald-400" : "text-rose-400"}`}
//             >
//               {portfolioStats.totalGainUSD >= 0 ? "+" : ""}$
//               {portfolioStats.totalGainUSD.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//               })}
//             </div>
//           </div>

//           <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 backdrop-blur flex flex-col justify-between">
//             <div className="text-xs text-slate-400 font-medium">
//               Regional Market Value
//             </div>
//             <div className="flex justify-between items-center text-xs mt-1">
//               <span className="text-blue-400 font-semibold">
//                 USA: $
//                 {usTotalUSD.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//               <span className="text-amber-400 font-semibold">
//                 GHANA: $
//                 {ghanaTotalUSD.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* HORIZONTAL GRID: CHART & CUMULATIVE HOLDINGS */}
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
//           <div className="lg:col-span-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col h-100">
//             <div className="flex justify-between items-center mb-3">
//               <div>
//                 <h2 className="text-sm font-bold text-white">Allocation</h2>
//               </div>

//               <div className="flex bg-slate-900/80 p-0.5 rounded-md border border-slate-700">
//                 {(["ALL", "USA", "GHANA"] as const).map((reg) => (
//                   <button
//                     key={reg}
//                     onClick={() => setRegionFilter(reg)}
//                     className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
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
//               {loading ? (
//                 <div className="flex items-center gap-2 text-slate-400 text-xs">
//                   <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                   Loading chart...
//                 </div>
//               ) : tickerAllocationData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={tickerAllocationData}
//                       cx="50%"
//                       cy="45%"
//                       innerRadius={50}
//                       outerRadius={75}
//                       paddingAngle={4}
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
//                         `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
//                         "USD Value",
//                       ]}
//                       contentStyle={{
//                         backgroundColor: "#0F172A",
//                         borderColor: "#334155",
//                         borderRadius: "6px",
//                         fontSize: "12px",
//                       }}
//                     />
//                     <Legend
//                       verticalAlign="bottom"
//                       height={28}
//                       wrapperStyle={{ fontSize: "11px" }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="text-slate-500 text-xs">
//                   No active holdings found.
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="lg:col-span-9 bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col h-100">
//             <div className="p-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/40">
//               <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
//                 <Layers className="w-4 h-4 text-blue-400" />
//                 Cumulative Holdings
//               </h2>
//               <span className="text-[11px] text-slate-400 font-mono">
//                 {cumulativeHoldings.length} Assets
//               </span>
//             </div>

//             <div className="overflow-y-auto overflow-x-auto flex-1">
//               {loading ? (
//                 <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
//                   <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                   Loading holdings...
//                 </div>
//               ) : cumulativeHoldings.length === 0 ? (
//                 <div className="p-8 text-center text-slate-500 text-xs">
//                   No holdings recorded yet.
//                 </div>
//               ) : (
//                 <table className="w-full text-left text-xs text-slate-300">
//                   <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-700/60">
//                     <tr>
//                       <th className="px-3 py-2.5">Asset</th>
//                       <th className="px-3 py-2.5">Shares</th>
//                       <th className="px-3 py-2.5">Avg Cost vs Price</th>
//                       <th className="px-3 py-2.5">Contributed</th>
//                       <th className="px-3 py-2.5">Market Value</th>
//                       <th className="px-3 py-2.5">Gain / Loss</th>
//                       <th className="px-3 py-2.5 text-right">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-700/40">
//                     {cumulativeHoldings.map((holding) => {
//                       const ticker = (holding.tickerOrSymbol || "")
//                         .trim()
//                         .toUpperCase();
//                       const isLive = Boolean(livePrices[ticker]);
//                       const isGhanaAsset =
//                         holding.region === RegionType.GHANA ||
//                         holding.currency === CurrencyType.GHS;
//                       const currencySymbol =
//                         holding.currency === CurrencyType.USD ? "$" : "GH₵";

//                       return (
//                         <tr
//                           key={holding.key}
//                           className="hover:bg-slate-700/20 transition-colors"
//                         >
//                           <td className="px-3 py-2.5">
//                             <div className="font-semibold text-white">
//                               {holding.name}
//                             </div>
//                             <div className="text-[10px] text-slate-400 font-mono">
//                               {holding.tickerOrSymbol || holding.assetClass}
//                             </div>
//                           </td>
//                           <td className="px-3 py-2.5 text-slate-200">
//                             {holding.totalShares.toLocaleString()}
//                           </td>
//                           <td className="px-3 py-2.5">
//                             <div className="text-slate-300">
//                               Avg: {currencySymbol}
//                               {holding.avgPricePerShare.toFixed(2)}
//                             </div>
//                             <div
//                               className={`text-[10px] font-semibold flex items-center gap-1 ${
//                                 isLive ? "text-emerald-400" : "text-blue-400"
//                               }`}
//                             >
//                               Now: {currencySymbol}
//                               {holding.currentPricePerShare?.toFixed(2)}
//                               {isLive && (
//                                 <span
//                                   className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
//                                   title="Live price fetched"
//                                 />
//                               )}
//                             </div>
//                           </td>
//                           <td className="px-3 py-2.5 font-mono text-slate-300">
//                             <div>
//                               $
//                               {holding.totalContributedUSD.toLocaleString(
//                                 "en-US",
//                                 {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 2,
//                                 },
//                               )}
//                             </div>
//                             {isGhanaAsset && (
//                               <div className="text-[10px] text-amber-400/90 font-medium">
//                                 GH₵
//                                 {holding.totalContributed.toLocaleString(
//                                   "en-US",
//                                   {
//                                     minimumFractionDigits: 2,
//                                     maximumFractionDigits: 2,
//                                   },
//                                 )}
//                               </div>
//                             )}
//                           </td>
//                           <td className="px-3 py-2.5 font-mono font-bold text-white">
//                             <div>
//                               $
//                               {holding.currentValueUSD.toLocaleString("en-US", {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </div>
//                             {isGhanaAsset && (
//                               <div className="text-[10px] text-amber-400/90 font-medium">
//                                 GH₵
//                                 {holding.currentValueGHS.toLocaleString(
//                                   "en-US",
//                                   {
//                                     minimumFractionDigits: 2,
//                                     maximumFractionDigits: 2,
//                                   },
//                                 )}
//                               </div>
//                             )}
//                           </td>
//                           <td className="px-3 py-2.5 font-mono font-semibold">
//                             <span
//                               className={
//                                 holding.unrealizedGainUSD >= 0
//                                   ? "text-emerald-400"
//                                   : "text-rose-400"
//                               }
//                             >
//                               {holding.unrealizedGainUSD >= 0 ? "+" : ""}$
//                               {holding.unrealizedGainUSD.toLocaleString(
//                                 "en-US",
//                                 {
//                                   minimumFractionDigits: 2,
//                                 },
//                               )}
//                               {isGhanaAsset && (
//                                 <span className="text-[10px] block text-amber-400/90 font-medium">
//                                   {holding.unrealizedGainGHS >= 0 ? "+" : ""}GH₵
//                                   {holding.unrealizedGainGHS.toLocaleString(
//                                     "en-US",
//                                     {
//                                       minimumFractionDigits: 2,
//                                       maximumFractionDigits: 2,
//                                     },
//                                   )}
//                                 </span>
//                               )}
//                               <span className="text-[10px] block">
//                                 ({holding.returnPercentage.toFixed(2)}%)
//                               </span>
//                             </span>
//                           </td>
//                           <td className="px-3 py-2.5 text-right">
//                             <button
//                               onClick={() => setSelectedHoldingKey(holding.key)}
//                               className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px]"
//                             >
//                               <History className="w-3 h-3" /> Log (
//                               {holding.transactions.length})
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* INDIVIDUAL TRANSACTIONS POPUP / MODAL */}
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

// // --- POPUP MODAL FOR INDIVIDUAL TRANSACTIONS ---
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
//               Individual Transaction Logs
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
//                           : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
//                       }`}
//                     >
//                       {tx.type}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2.5">
//                     {tx.shares ? (
//                       <div>
//                         {tx.shares} @{" "}
//                         {tx.currency === CurrencyType.USD ? "$" : "GH₵"}
//                         {tx.pricePerShare}
//                       </div>
//                     ) : (
//                       <span className="text-slate-500">—</span>
//                     )}
//                   </td>
//                   <td className="px-3 py-2.5 font-mono">
//                     {tx.currency === CurrencyType.USD ? "$" : "GH₵"}
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

// // --- ADD INVESTMENT MODAL ---
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

// // --- EDIT INVESTMENT MODAL ---
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
