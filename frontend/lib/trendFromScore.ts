import type { CompanyAnalysis } from "@/types";

/** Synthetic week view anchored on blended sentiment so the chart feels tied to live scores. */
export function trendBase(offset: number): CompanyAnalysis["trend"] {
  const o = Math.round(Math.min(40, Math.max(-40, offset)));
  return [
    { label: "Mon", sentiment: 42 + o, perceptionRisk: 38, event: "Earnings preview" },
    { label: "Tue", sentiment: 48 + o, perceptionRisk: 41 },
    { label: "Wed", sentiment: 55 + o, perceptionRisk: 44, event: "Analyst note" },
    { label: "Thu", sentiment: 51 + o, perceptionRisk: 52 },
    { label: "Fri", sentiment: 58 + o, perceptionRisk: 49, event: "Sector move" },
    { label: "Sat", sentiment: 61 + o, perceptionRisk: 47 },
    { label: "Sun", sentiment: 64 + o, perceptionRisk: 45 },
  ];
}
