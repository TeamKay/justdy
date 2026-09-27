"use client";

import { CalendarDays, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type ClientGrowthPoint = {
  date: string;
  label: string;
  value: number;
};

const ranges = ["3M", "6M", "1Y", "ALL"] as const;
type Range = (typeof ranges)[number];

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAxisDate(value: string, fallbackLabel: string) {
  const date = toDate(value);

  if (!date) return fallbackLabel;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function ClientGrowthChart({
  points,
}: {
  points: ClientGrowthPoint[];
}) {
  const [range, setRange] = useState<Range>("6M");
  const [fromDate, setFromDate] = useState("");
  const [toDateValue, setToDateValue] = useState("");

  const safePoints = useMemo(
    () =>
      [...points].sort((a, b) => {
        const aTime = toDate(a.date)?.getTime() ?? 0;
        const bTime = toDate(b.date)?.getTime() ?? 0;
        return aTime - bTime;
      }),
    [points],
  );

  const filteredPoints = useMemo(() => {
    if (!safePoints.length) return [];

    if (fromDate || toDateValue) {
      const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      const to = toDateValue ? new Date(`${toDateValue}T23:59:59.999`) : null;

      return safePoints.filter((point) => {
        const pointDate = toDate(point.date);
        if (!pointDate) return false;

        return (!from || pointDate >= from) && (!to || pointDate <= to);
      });
    }

    if (range === "ALL") return safePoints;

    const count = range === "3M" ? 3 : range === "6M" ? 6 : 12;
    return safePoints.slice(-count);
  }, [fromDate, range, safePoints, toDateValue]);

  const chartPoints =
    filteredPoints.length > 0
      ? filteredPoints
      : [{ date: "", label: "No data", value: 0 }];

  const latest = chartPoints[chartPoints.length - 1]?.value ?? 0;
  const first = chartPoints[0]?.value ?? 0;
  const change = first > 0 ? Math.round(((latest - first) / first) * 100) : null;
  const hasCustomRange = Boolean(fromDate || toDateValue);

  const width = 1400;
  const height = 360;
  const padding = { top: 24, right: 24, bottom: 54, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(10, ...chartPoints.map((point) => point.value));
  const yMax = Math.ceil(maxValue / 10) * 10;
  const stepX = chartPoints.length > 1 ? chartWidth / (chartPoints.length - 1) : chartWidth;

  const coordinates = chartPoints.map((point, index) => ({
    ...point,
    x: padding.left + index * stepX,
    y: padding.top + chartHeight - (point.value / yMax) * chartHeight,
  }));

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${padding.top + chartHeight} L ${coordinates[0].x} ${padding.top + chartHeight} Z`;
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  const clearFilters = () => {
    setFromDate("");
    setToDateValue("");
    setRange("6M");
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mt-0 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Showing <strong className="font-semibold text-foreground">{chartPoints.length}</strong> data points
            </span>
            {change !== null ? (
              <span className={change >= 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>
                {change >= 0 ? "+" : ""}{change}% across selected range
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {ranges.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setRange(item);
                setFromDate("");
                setToDateValue("");
              }}
              className={`h-9 rounded-lg px-3.5 text-xs font-semibold transition ${
                range === item && !hasCustomRange
                  ? "bg-foreground text-background"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item === "ALL" ? "All" : item}
            </button>
          ))}

          <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

          <label className="relative">
            <span className="sr-only">From date</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={fromDate}
              max={toDateValue || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setRange("ALL");
              }}
              className="h-9 rounded-lg border border-border bg-background pl-9 pr-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-ring"
              aria-label="Filter from date"
            />
          </label>

          <span className="text-xs text-muted-foreground">to</span>

          <label className="relative">
            <span className="sr-only">To date</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={toDateValue}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDateValue(event.target.value);
                setRange("ALL");
              }}
              className="h-9 rounded-lg border border-border bg-background pl-9 pr-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-ring"
              aria-label="Filter to date"
            />
          </label>

          {hasCustomRange ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-80 w-full sm:h-90"
          preserveAspectRatio="none"
          role="img"
          aria-label="Tutoring client growth line graph"
        >
          <defs>
            <linearGradient id="clientGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(79 70 229)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(79 70 229)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {gridValues.map((ratio) => {
            const y = padding.top + chartHeight - ratio * chartHeight;
            const value = Math.round(yMax * ratio);

            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px]"
                >
                  {value}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#clientGrowthFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="rgb(79 70 229)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coordinates.map((point, index) => (
            <g key={`${point.date}-${point.label}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="rgb(79 70 229)"
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={height - 14}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px] font-medium"
              >
                {point.date ? formatAxisDate(point.date, point.label) : point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
