/**
 * CLI entry for `npm run eval:golden` (via vitest so path aliases resolve).
 * Excluded from default `npm test` — see vitest.config.ts.
 * Writes evals/out/latest.json and fails if thresholds are not met.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runGoldenEval } from "@/lib/eval/runGolden";

describe("golden eval (offline)", () => {
  it("meets precision/recall thresholds and writes latest.json", () => {
    const result = runGoldenEval();
    const outDir = join(process.cwd(), "evals", "out");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, "latest.json");
    writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

    // eslint-disable-next-line no-console
    console.log(
      `[eval:golden] cases=${result.metrics.caseCount} P=${result.metrics.precision} R=${result.metrics.recall} F1=${result.metrics.f1} thresholdsMet=${result.thresholdsMet}`,
    );
    // eslint-disable-next-line no-console
    console.log(`[eval:golden] wrote ${outPath}`);

    expect(result.metrics.explainabilityPass).toBe(true);
    expect(result.metrics.recall).toBeGreaterThanOrEqual(
      result.thresholds.recallMin,
    );
    expect(result.metrics.precision).toBeGreaterThanOrEqual(
      result.thresholds.precisionMin,
    );
    expect(result.thresholdsMet).toBe(true);
  });
});
