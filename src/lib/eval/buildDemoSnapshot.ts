import { readFileSync } from "node:fs";
import { join } from "node:path";

import { finalizeReport } from "@/lib/audit/finalizeReport";
import { buildRulesOnlyWorkpaper } from "@/lib/graph/degraded-workpaper";
import { parseAuditFile } from "@/lib/parse";
import { runRules } from "@/lib/rules";
import type { AuditFinding, AuditReport, RiskLevel } from "@/types/audit";

const SEVERITY_RANK: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function deriveRiskLevel(findings: AuditFinding[]): RiskLevel {
  let level: RiskLevel = "low";
  for (const f of findings) {
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[level]) level = f.severity;
  }
  return level;
}

export type DemoSnapshotFile = {
  kind: "failover_snapshot";
  label: string;
  disclaimer: string;
  dataset: string;
  generatedAt: string;
  report: AuditReport;
};

/** Build official demo snapshot from samples CSV (rules-only, offline). */
export function buildDemoSnapshot(
  dataset = "ey_expense_demo_3k.csv",
): DemoSnapshotFile {
  const buffer = readFileSync(join(process.cwd(), "samples", dataset));
  const transactions = parseAuditFile(buffer, dataset);
  const findings = runRules(transactions);
  const riskLevel = deriveRiskLevel(findings);
  const workpaper = buildRulesOnlyWorkpaper({
    riskLevel,
    findings,
    planNote:
      "【官方演示快照】基于 ey_expense_demo_3k.csv 的规则引擎预计算结果，用于断网/故障兜底。",
  });

  const report = finalizeReport(
    {
      jobId: "snapshot-ey-demo",
      riskLevel,
      findings,
      workpaper,
      meta: { degraded: true, llmSkipped: true, mode: "rules_only" },
    },
    {
      trailEvent: "snapshot_generated",
      trailDetail: `dataset=${dataset}`,
    },
  );

  return {
    kind: "failover_snapshot",
    label: "Official Demo Snapshot (failover)",
    disclaimer:
      "Snapshot for failover — 非本次 live 跑批结果。用于演示故障时展示可解释风险与底稿骨架。",
    dataset,
    generatedAt: new Date().toISOString(),
    report,
  };
}
