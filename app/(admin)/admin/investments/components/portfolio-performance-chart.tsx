"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; value: number };
type Range = "1M" | "3M" | "6M" | "1Y" | "ALL";

const ranges: { label: string; value: Range }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "ALL" },
];

export default function PortfolioPerformanceChart({
  data,
  currency,
}: {
  data: Point[];
  currency: "USD" | "GHS";
}) {
  const [selectedRange, setSelectedRange] = useState<Range>("6M");

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const sortedData = useMemo(
    () =>
      [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [data],
  );

  const filteredData = useMemo(() => {
    if (selectedRange === "ALL" || sortedData.length === 0) {
      return sortedData;
    }

    const latestDate = new Date(sortedData[sortedData.length - 1].date);
    const cutoff = new Date(latestDate);

    switch (selectedRange) {
      case "1M":
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case "3M":
        cutoff.setMonth(cutoff.getMonth() - 3);
        break;
      case "6M":
        cutoff.setMonth(cutoff.getMonth() - 6);
        break;
      case "1Y":
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        break;
    }

    return sortedData.filter(
      (point) => new Date(point.date).getTime() >= cutoff.getTime(),
    );
  }, [sortedData, selectedRange]);

  if (data.length < 2) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
        <div>
          <p className="font-medium text-slate-700">
            Your growth chart is getting ready
          </p>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Capture a portfolio snapshot each day. Once at least two snapshots
            exist, your historical portfolio value will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Portfolio value over time
        </p>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {ranges.map((range) => {
            const active = selectedRange === range.value;

            return (
              <button
                key={range.value}
                type="button"
                onClick={() => setSelectedRange(range.value)}
                aria-pressed={active}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredData.length < 2 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Not enough history for this period
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Choose a longer time range or capture more portfolio snapshots.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) =>
                  new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(value))
                }
                minTickGap={28}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                width={82}
                tickFormatter={(value: number) => formatter.format(value)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(value) =>
                  new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(new Date(String(value)))
                }
                formatter={(value) => [
                  formatter.format(Number(value)),
                  "Portfolio value",
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Portfolio value"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
