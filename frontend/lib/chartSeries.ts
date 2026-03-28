import type { TrendPoint } from "@/types";

/** Google Finance–style ranges (mock aggregation). */
export type ChartTimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

export const CHART_TIME_RANGES: { value: ChartTimeRange; label: string }[] = [
  { value: "1D", label: "1D" },
  { value: "5D", label: "5D" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "YTD", label: "YTD" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
];

const EVENTS = [
  "Earnings beat",
  "Analyst downgrade",
  "Sector rotation",
  "Macro CPI print",
  "Guidance cut",
  "M&A chatter",
  "Regulatory headline",
  "Insider selling",
  "Product launch",
  "Short report",
];

function tickerPhase(ticker: string): number {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (Math.imul(31, h) + ticker.charCodeAt(i)) | 0;
  return (Math.abs(h) % 360) * (Math.PI / 180);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

type RangeSpec = { labels: string[]; eventAt: number[] };

function rangeSpec(range: ChartTimeRange): RangeSpec {
  switch (range) {
    case "1D":
      return {
        labels: ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p"],
        eventAt: [2, 6],
      };
    case "5D":
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        eventAt: [1, 4],
      };
    case "1M":
      return {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
        eventAt: [2, 5],
      };
    case "3M":
      return {
        labels: ["Wk 1", "Wk 3", "Wk 5", "Wk 7", "Wk 9", "Wk 11", "Wk 13"],
        eventAt: [2, 5],
      };
    case "6M":
      return {
        labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
        eventAt: [1, 4],
      };
    case "YTD":
      return {
        labels: ["Jan", "Feb", "Mar"],
        eventAt: [0, 2],
      };
    case "1Y":
      return {
        labels: [
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
          "Jan",
          "Feb",
          "Mar",
        ],
        eventAt: [3, 8],
      };
    case "5Y":
      return {
        labels: ["2022", "2023", "2024", "2025", "2026"],
        eventAt: [1, 3],
      };
    default:
      return { labels: [], eventAt: [] };
  }
}

/**
 * Deterministic mock series per ticker, chart offset (from seed trend), and range.
 */
export function generateChartSeries(
  ticker: string,
  chartOffset: number,
  range: ChartTimeRange,
): TrendPoint[] {
  const { labels, eventAt } = rangeSpec(range);
  const n = labels.length;
  const phase = tickerPhase(ticker);
  const out: TrendPoint[] = [];

  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0 : i / (n - 1);
    const wobble = 4 * Math.sin(i * 1.1 + phase);
    const base = 48 + chartOffset * 0.35;
    const sentiment = clamp(
      Math.round(
        base + 16 * Math.sin(t * Math.PI * 1.6 + phase) + wobble + (i % 3) * 2,
      ),
      8,
      92,
    );
    const perceptionRisk = clamp(
      Math.round(
        base -
          6 +
          18 * Math.cos(t * Math.PI + phase * 0.6) +
          chartOffset * 0.15 +
          (i % 4) * 2,
      ),
      8,
      92,
    );
    const ev = eventAt.includes(i);
    const event = ev
      ? EVENTS[(i + ticker.length + chartOffset) % EVENTS.length]
      : undefined;
    out.push({
      label: labels[i]!,
      sentiment,
      perceptionRisk,
      event,
    });
  }

  return out;
}
