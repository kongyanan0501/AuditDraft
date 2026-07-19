import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseAuditFile } from "@/lib/parse";
import { runRules } from "@/lib/rules";
import type { AuditFinding } from "@/types/audit";

import type {
  CaseResult,
  GoldenCase,
  GoldenEvalResult,
  GoldenSet,
} from "./types";

function evidenceIds(evidence: unknown): string[] {
  if (!evidence || typeof evidence !== "object") return [];
  const e = evidence as Record<string, unknown>;
  if (Array.isArray(e.transactionIds)) return e.transactionIds.map(String);
  if (e.transactionId != null) return [String(e.transactionId)];
  return [];
}

function findingCovers(
  finding: AuditFinding,
  ruleId: string,
  transactionIds: string[],
): boolean {
  if (finding.riskType !== ruleId) return false;
  const ids = evidenceIds(finding.evidence);
  return transactionIds.every((id) => ids.includes(id));
}

function findingTouches(
  finding: AuditFinding,
  ruleId: string,
  transactionIds: string[],
): boolean {
  if (finding.riskType !== ruleId) return false;
  const ids = evidenceIds(finding.evidence);
  return transactionIds.some((id) => ids.includes(id));
}

function evaluateCase(
  c: GoldenCase,
  findings: AuditFinding[],
): CaseResult {
  const rules = c.expectedRuleIds.map(String);

  if (c.shouldFire) {
    const ok = rules.every((ruleId) =>
      findings.some((f) => findingCovers(f, ruleId, c.transactionIds)),
    );
    return {
      id: c.id,
      shouldFire: true,
      expectedRuleIds: rules,
      passed: ok,
      kind: ok ? "tp" : "fn",
      detail: ok
        ? "expected rule(s) hit with evidence ids"
        : "missing expected finding coverage",
    };
  }

  const fired = rules.some((ruleId) =>
    findings.some((f) => findingTouches(f, ruleId, c.transactionIds)),
  );
  const ok = !fired;
  return {
    id: c.id,
    shouldFire: false,
    expectedRuleIds: rules,
    passed: ok,
    kind: ok ? "tn" : "fp",
    detail: ok
      ? "correctly did not fire on these ids"
      : "unexpected rule fire on negative case ids",
  };
}

function checkExplainability(findings: AuditFinding[]): {
  pass: boolean;
  failures: number;
} {
  let failures = 0;
  for (const f of findings) {
    const ok =
      Boolean(f.triggeredRule) &&
      f.evidence != null &&
      Boolean(f.explanation?.trim());
    if (!ok) failures += 1;
  }
  return { pass: failures === 0, failures };
}

/** Load golden JSON from repo root (process.cwd()). */
export function loadGoldenSet(
  relativePath = "evals/golden/expense_v1.json",
): GoldenSet {
  const raw = readFileSync(join(process.cwd(), relativePath), "utf8");
  return JSON.parse(raw) as GoldenSet;
}

/**
 * Offline golden evaluation: parse dataset → runRules → case metrics.
 * No LLM / network.
 */
export function runGoldenEval(
  golden: GoldenSet = loadGoldenSet(),
): GoldenEvalResult {
  const buffer = readFileSync(
    join(process.cwd(), "samples", golden.dataset),
  );
  const transactions = parseAuditFile(buffer, golden.dataset);
  const findings = runRules(transactions);

  const caseResults = golden.cases.map((c) => evaluateCase(c, findings));
  const tp = caseResults.filter((c) => c.kind === "tp").length;
  const tn = caseResults.filter((c) => c.kind === "tn").length;
  const fp = caseResults.filter((c) => c.kind === "fp").length;
  const fn = caseResults.filter((c) => c.kind === "fn").length;

  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  const explain = checkExplainability(findings);
  const thresholdsMet =
    recall >= golden.thresholds.recallMin &&
    precision >= golden.thresholds.precisionMin &&
    (!golden.thresholds.explainabilityRequired || explain.pass);

  return {
    version: golden.version,
    dataset: golden.dataset,
    rulesetVersion: golden.rulesetVersion,
    ranAt: new Date().toISOString(),
    offline: true,
    metrics: {
      caseCount: caseResults.length,
      tp,
      tn,
      fp,
      fn,
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
      explainabilityPass: explain.pass,
      explainabilityFailures: explain.failures,
    },
    thresholds: golden.thresholds,
    thresholdsMet,
    cases: caseResults,
  };
}
