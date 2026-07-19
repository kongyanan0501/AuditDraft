import type { AuditFinding, Transaction } from "@/types/audit";

import {
  DEFAULT_RULE_CONFIG,
  type RuleConfig,
} from "./config";

/** @deprecated Prefer RuleConfig.approvalThreshold */
export const APPROVAL_THRESHOLD = DEFAULT_RULE_CONFIG.approvalThreshold;

/**
 * missing_approval：amount > threshold && approver == null。
 */
export function missingApproval(
  transactions: Transaction[],
  config: RuleConfig = DEFAULT_RULE_CONFIG,
): AuditFinding[] {
  const threshold = config.approvalThreshold;
  const findings: AuditFinding[] = [];
  for (const t of transactions) {
    const noApprover = t.approver == null || String(t.approver).trim() === "";
    if (t.amount > threshold && noApprover) {
      findings.push({
        riskType: "missing_approval",
        severity: "high",
        triggeredRule: `missing_approval: amount > ${threshold} && approver == null`,
        evidence: {
          transactionId: t.id,
          vendor: t.vendor,
          amount: t.amount,
          approver: t.approver,
          invoiceId: t.invoiceId,
          threshold,
        },
        standardRef:
          "《中国注册会计师审计准则第 1211 号——识别和评估重大错报风险》（授权审批控制）",
        explanation: `交易 ${t.id}（供应商「${t.vendor}」，金额 ${t.amount}）超过审批阈值 ${threshold} 却无审批人，存在未授权大额支出风险。`,
      });
    }
  }
  return findings;
}
