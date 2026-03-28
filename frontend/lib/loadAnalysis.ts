import type { CompanyAnalysis } from "@/types";
import type { AnalyzeResponseJson } from "./analyzeTypes";
import { getApiBaseUrl } from "./env";
import { mapAnalyzeResponse } from "./mapAnalyzeResponse";
import { getMockAnalysis } from "./mockData";

export type LoadAnalysisStatus =
  | "live"
  | "mock_api_down"
  | "mock_http_error"
  | "mock_empty_query";

export interface LoadAnalysisResult {
  data: CompanyAnalysis;
  status: LoadAnalysisStatus;
  httpStatus?: number;
  detail?: string;
}

function isAnalyzeResponse(x: unknown): x is AnalyzeResponseJson {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.analysis_id === "string" && o.company != null && o.news != null;
}

export async function loadAnalysis(query: string): Promise<LoadAnalysisResult> {
  const q = query.trim();
  if (!q) {
    return { data: getMockAnalysis("AAPL"), status: "mock_empty_query" };
  }

  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, force_refresh: false }),
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody && typeof errBody === "object" && "detail" in errBody) {
          detail = String((errBody as { detail: unknown }).detail);
        }
      } catch {
        detail = await res.text().catch(() => detail);
      }
      return {
        data: { ...getMockAnalysis(q), dataSource: "mock" },
        status: "mock_http_error",
        httpStatus: res.status,
        detail,
      };
    }

    const json: unknown = await res.json();
    if (!isAnalyzeResponse(json)) {
      return {
        data: { ...getMockAnalysis(q), dataSource: "mock" },
        status: "mock_http_error",
        detail: "Unexpected API response shape",
      };
    }

    return { data: mapAnalyzeResponse(json), status: "live" };
  } catch {
    return {
      data: { ...getMockAnalysis(q), dataSource: "mock" },
      status: "mock_api_down",
      detail: "Could not reach the API. Is the backend running?",
    };
  }
}
