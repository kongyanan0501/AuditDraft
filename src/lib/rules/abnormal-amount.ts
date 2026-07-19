import type { AuditFinding, Transaction } from "@/types/audit";

import { DEFAULT_RULE_CONFIG, type RuleConfig } from "./config";

const MIN_SAMPLE = 3;

/**
 * abnormal_amount：金额统计离群（|z-score| > 阈值）。
 */
export function abnormalAmount(
  transactions: Transaction[],
  config: RuleConfig = DEFAULT_RULE_CONFIG,
): AuditFinding[] {
  if (transactions.length < MIN_SAMPLE) return [];

  const zThreshold = config.zScoreThreshold;
  const amounts = transactions.map((t) => t.amount);
  const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const variance =
    amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  const findings: AuditFinding[] = [];
  for (const t of transactions) {
    const zScore = (t.amount - mean) / std;
    if (Math.abs(zScore) > zThreshold) {
      findings.push({
        riskType: "abnormal_amount",
        severity: "medium",
        triggeredRule: `abnormal_amount: |z-score| > ${zThreshold}`,
        evidence: {
          transactionId: t.id,
          vendor: t.vendor,
          amount: t.amount,
          mean: Number(mean.toFixed(2)),
          std: Number(std.toFixed(2)),
          zScore: Number(zScore.toFixed(2)),
          zThreshold,
        },
        standardRef:
          "《中国注册会计师审计准则第 1231 号——针对评估的重大错报风险采取的应对措施》",
        explanation: `交易 ${t.id} 金额 ${t.amount} 显著偏离均值(${mean.toFixed(0)})，z-score=${zScore.toFixed(2)}，属金额离群异常。`,
      });
    }
  }
  return findings;
}
