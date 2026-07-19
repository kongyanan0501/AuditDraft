import type { AuditFinding, AuditReport } from "@/types/audit";

import {
  RULESET_VERSION,
  amountFromEvidence,
  classifyMaterialityImpact,
  getMaterialityConfig,
  type MaterialityConfig,
} from "./materiality";
import { proceduresForRisk } from "./procedures";

export type AuditTrailEvent = {
  at: string;
  event: string;
  detail?: string;
};

export function enrichFindings(
  findings: AuditFinding[],
  cfg: MaterialityConfig = getMaterialityConfig(),
): AuditFinding[] {
  return findings.map((f, i) => {
    const amount = amountFromEvidence(f.evidence);
    return {
      ...f,
      findingId: f.findingId ?? `F-${String(i + 1).padStart(3, "0")}`,
      rulesetVersion: f.rulesetVersion ?? RULESET_VERSION,
      recommendedProcedures:
        f.recommendedProcedures ?? proceduresForRisk(String(f.riskType)),
      materialityImpact:
        f.materialityImpact ?? classifyMaterialityImpact(amount, cfg),
      reviewerStatus: f.reviewerStatus ?? "open",
      fraudRiskFlag:
        f.fraudRiskFlag ??
        (f.riskType === "duplicate_payment" ||
          f.riskType === "split_expense"),
    };
  });
}

/** Attach EY-facing metadata, procedures, materiality, and trail. */
export function finalizeReport(
  report: AuditReport,
  opts?: { trailEvent?: string; trailDetail?: string },
): AuditReport {
  const cfg = getMaterialityConfig();
  const findings = enrichFindings(report.findings, cfg);
  const at = new Date().toISOString();
  const prevTrail = report.meta?.trail ?? [];
  const trail: AuditTrailEvent[] = [
    ...prevTrail,
    {
      at,
      event: opts?.trailEvent ?? "report_finalized",
      detail:
        opts?.trailDetail ??
        `ruleset=${RULESET_VERSION}; findings=${findings.length}; mode=${report.meta?.mode ?? "full"}`,
    },
  ];

  return {
    ...report,
    findings,
    meta: {
      ...report.meta,
      rulesetVersion: RULESET_VERSION,
      materiality: cfg,
      trail,
    },
  };
}
