import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { GoldenEvalResult } from "./types";

export type HumanBaseline = {
  datasetId: string;
  label: string;
  notes?: string;
  analystMinutes: number;
  systemSecondsEstimate: number;
  hits: number;
  misses: number;
  falsePositives: number;
  plantedPositiveCount: number;
  method?: string;
};

function readJsonSafe<T>(relativePath: string): T | null {
  try {
    const raw = readFileSync(join(process.cwd(), relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Server-only helpers for the Eval page. */
export function loadLatestEval(): GoldenEvalResult | null {
  return readJsonSafe<GoldenEvalResult>("evals/out/latest.json");
}

export function loadHumanBaseline(): HumanBaseline | null {
  return readJsonSafe<HumanBaseline>("evals/human-baseline.json");
}
