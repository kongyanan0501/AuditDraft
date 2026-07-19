import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseAuditFile } from "@/lib/parse";
import { runRules, type RuleId } from "@/lib/rules";

type PlantedRisk = {
  id: string;
  ruleId: RuleId;
  transactionIds: string[];
};

type Manifest = {
  dataset: string;
  planted: PlantedRisk[];
};

function evidenceIds(evidence: unknown): string[] {
  if (!evidence || typeof evidence !== "object") return [];
  const e = evidence as Record<string, unknown>;
  if (Array.isArray(e.transactionIds)) return e.transactionIds.map(String);
  if (e.transactionId != null) return [String(e.transactionId)];
  return [];
}

describe("EY demo planted risks", () => {
  it("hits every planted case in ey_expense_demo_3k.csv", () => {
    const root = process.cwd();
    const manifest = JSON.parse(
      readFileSync(join(root, "samples", "planted_risks.json"), "utf8"),
    ) as Manifest;
    const buffer = readFileSync(join(root, "samples", manifest.dataset));
    const transactions = parseAuditFile(buffer, manifest.dataset);

    expect(transactions.length).toBeGreaterThanOrEqual(3000);

    const findings = runRules(transactions);
    const misses: string[] = [];

    for (const plant of manifest.planted) {
      const hit = findings.some(
        (f) =>
          f.riskType === plant.ruleId &&
          plant.transactionIds.every((id) =>
            evidenceIds(f.evidence).includes(id),
          ),
      );
      if (!hit) misses.push(`${plant.id}:${plant.ruleId}`);
    }

    expect(misses, `missed planted risks: ${misses.join(", ")}`).toEqual([]);
  });
});
