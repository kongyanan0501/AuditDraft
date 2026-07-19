import type { AuditFinding, Transaction } from "@/types/audit";

import { DEFAULT_RULE_CONFIG, type RuleConfig } from "./config";

/**
 * split_expense：同一供应商多笔「刚好低于审批阈值」的支出。
 */
export function splitExpense(
  transactions: Transaction[],
  config: RuleConfig = DEFAULT_RULE_CONFIG,
): AuditFinding[] {
  const threshold = config.approvalThreshold;
  const lower = threshold * config.splitNearRatio;
  const nearThreshold = transactions.filter(
    (t) => t.amount >= lower && t.amount < threshold,
  );

  const groups = new Map<string, Transaction[]>();
  for (const t of nearThreshold) {
    const bucket = groups.get(t.vendor);
    if (bucket) bucket.push(t);
    else groups.set(t.vendor, [t]);
  }

  const findings: AuditFinding[] = [];
  for (const [vendor, group] of groups) {
    if (group.length < 2) continue;
    const total = group.reduce((sum, t) => sum + t.amount, 0);
    findings.push({
      riskType: "split_expense",
      severity: "medium",
      triggeredRule: `split_expense: ≥2 笔金额落在 [${lower}, ${threshold}) 的同一供应商支出`,
      evidence: {
        vendor,
        transactionIds: group.map((t) => t.id),
        amounts: group.map((t) => t.amount),
        total,
        count: group.length,
        threshold,
        lower,
      },
      standardRef:
        "《中国注册会计师审计准则第 1211 号——识别和评估重大错报风险》（规避内部控制）",
      explanation: `供应商「${vendor}」存在 ${group.length} 笔接近审批阈值(${threshold})的支出，合计 ${total}，疑似拆分报销以规避审批。`,
    });
  }
  return findings;
}
