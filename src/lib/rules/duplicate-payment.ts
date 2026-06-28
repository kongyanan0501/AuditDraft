import type { AuditFinding, Transaction } from "@/types/audit";

/**
 * duplicate_payment：same vendor + same amount + same invoiceId。
 * 同一组出现 ≥2 笔即判定重复付款（同时覆盖「重复发票」场景）。纯函数，确定性输出。
 */
export function duplicatePayment(transactions: Transaction[]): AuditFinding[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = `${t.vendor}__${t.amount}__${t.invoiceId}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(t);
    else groups.set(key, [t]);
  }

  const findings: AuditFinding[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [first] = group;
    findings.push({
      riskType: "duplicate_payment",
      severity: "high",
      triggeredRule: "duplicate_payment: same vendor + same amount + same invoiceId",
      evidence: {
        vendor: first.vendor,
        amount: first.amount,
        invoiceId: first.invoiceId,
        transactionIds: group.map((t) => t.id),
        count: group.length,
      },
      explanation: `供应商「${first.vendor}」存在 ${group.length} 笔金额(${first.amount})与发票号(${first.invoiceId})完全相同的付款，疑似重复付款 / 重复发票。`,
    });
  }
  return findings;
}
