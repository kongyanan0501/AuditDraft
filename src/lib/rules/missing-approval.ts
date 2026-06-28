import type { AuditFinding, Transaction } from "@/types/audit";

/** 需审批的金额阈值（含）。超过该值且无审批人即视为缺审批。 */
export const APPROVAL_THRESHOLD = 10000;

/**
 * missing_approval：amount > APPROVAL_THRESHOLD && approver == null。
 * 大额支出缺少审批人，属内控缺陷。纯函数，确定性输出。
 */
export function missingApproval(transactions: Transaction[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of transactions) {
    const noApprover = t.approver == null || String(t.approver).trim() === "";
    if (t.amount > APPROVAL_THRESHOLD && noApprover) {
      findings.push({
        riskType: "missing_approval",
        severity: "high",
        triggeredRule: `missing_approval: amount > ${APPROVAL_THRESHOLD} && approver == null`,
        evidence: {
          transactionId: t.id,
          vendor: t.vendor,
          amount: t.amount,
          approver: t.approver,
          invoiceId: t.invoiceId,
        },
        explanation: `交易 ${t.id}（供应商「${t.vendor}」，金额 ${t.amount}）超过审批阈值 ${APPROVAL_THRESHOLD} 却无审批人，存在未授权大额支出风险。`,
      });
    }
  }
  return findings;
}
