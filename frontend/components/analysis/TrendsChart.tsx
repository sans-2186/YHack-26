"use client";

import { useMemo, useState } from "react";
import type { CompanyAnalysis, TrendPoint } from "@/types";
import {
  CHART_TIME_RANGES,
  type ChartTimeRange,
  generateChartSeries,
} from "@/lib/chartSeries";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_HINT: Record<ChartTimeRange, string> = {
  "1D": "Intraday (mock hours)",
  "5D": "Last 5 sessions",
  "1M": "Last month · weekly buckets",
  "3M": "Quarter · ~biweekly",
  "6M": "Half year · monthly",
  YTD: "Year to date · monthly",
  "1Y": "Trailing 12 months",
  "5Y": "Annual points (mock)",
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-white">{p.label}</p>
      <p className="mt-1 text-emerald-300">Sentiment: {p.sentiment}</p>
      <p className="text-amber-200">Perception risk: {p.perceptionRisk}</p>
      {p.event && <p className="mt-2 border-t border-white/10 pt-2 text-zinc-300">Event: {p.event}</p>}
    </div>
  );
}

export function TrendsChart({ data }: { data: CompanyAnalysis }) {
  const [range, setRange] = useState<ChartTimeRange>("1M");

  const chartOffset = useMemo(() => {
    const first = data.trend[0]?.sentiment;
    if (first == null) return 0;
    return first - 42;
  }, [data.trend]);

  const chartData = useMemo(
    () => generateChartSeries(data.ticker, chartOffset, range),
    [data.ticker, chartOffset, range],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Sentiment & perception risk</h2>
          <p className="mt-1 text-xs text-zinc-500">{RANGE_HINT[range]} · cyan dots = headline events</p>
        </div>
        <div
          className="-mx-1 overflow-x-auto pb-1 lg:mx-0 lg:pb-0"
          role="tablist"
          aria-label="Chart time range"
        >
          <div className="inline-flex min-w-min gap-0.5 rounded-full border border-white/10 bg-zinc-950/80 p-0.5 shadow-inner shadow-black/40">
            {CHART_TIME_RANGES.map(({ value, label }) => {
              const active = range === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRange(value)}
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 ${
                    active
                      ? "bg-zinc-100 text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }} />
            <Line
              type="monotone"
              dataKey="sentiment"
              name="Sentiment"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981", stroke: "#022c22", strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="perceptionRisk"
              name="Perception risk"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#fbbf24", stroke: "#422006", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            {chartData
              .map((d, i) => ({ d, i }))
              .filter(({ d }) => d.event)
              .map(({ d, i }) => (
                <ReferenceDot
                  key={`${range}-${i}-${d.label}`}
                  x={d.label}
                  y={d.sentiment}
                  r={6}
                  fill="#22d3ee"
                  stroke="#ecfeff"
                  strokeWidth={2}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Sentiment
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-amber-400" />
          Perception risk
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-white/30" />
          Event marker
        </li>
      </ul>
    </div>
  );
}
