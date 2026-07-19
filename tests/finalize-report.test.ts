import { describe, expect, it } from "vitest";

import { finalizeReport } from "@/lib/audit/finalizeReport";
import type { AuditReport } from "@/types/audit";

describe("finalizeReport (EY package B enrichment)", () => {
  it("adds procedures, materiality, findingId, review status, trail", () => {
    const draft: AuditReport = {
      jobId: "j1",
      riskLevel: "high",
      findings: [
        {
          riskType: "duplicate_payment",
          severity: "high",
          triggeredRule: "dup",
          evidence: { amount: 5000, transactionIds: ["1", "2"] },
          explanation: "dup",
        },
      ],
      workpaper: "wp",
      meta: { mode: "rules_only", degraded: true, llmSkipped: true },
    };

    const report = finalizeReport(draft, { trailEvent: "test" });
    const f = report.findings[0]!;

    expect(f.findingId).toBe("F-001");
    expect(f.recommendedProcedures?.length).toBeGreaterThan(0);
    expect(f.materialityImpact).toBeTruthy();
    expect(f.reviewerStatus).toBe("open");
    expect(f.fraudRiskFlag).toBe(true);
    expect(report.meta?.rulesetVersion).toBe("rules-v1");
    expect(report.meta?.materiality).toBeDefined();
    expect(report.meta?.trail?.some((t) => t.event === "test")).toBe(true);
  });
});
