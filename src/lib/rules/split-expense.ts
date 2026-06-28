import type { AuditFinding, Transaction } from "@/types/audit";

import { APPROVAL_THRESHOLD } from "./missing-approval";

/** 「接近阈值」的下限比例：金额落在 [阈值*0.8, 阈值) 视为贴边规避审批。 */
const NEAR_THRESHOLD_RATIO = 0.8;

/**
 * split_expense：同一供应商出现多笔「刚好低于审批阈值」的支出，疑似拆分报销以规避审批。
 * 判定：amount ∈ [APPROVAL_THRESHOLD*0.8, APPROVAL_THRESHOLD)，按 vendor 分组，组内 ≥2 笔即命中。
 * 纯函数，确定性输出。
 */
export function splitExpense(transactions: Transaction[]): AuditFinding[] {
  const lower = APPROVAL_THRESHOLD * NEAR_THRESHOLD_RATIO;
  const nearThreshold = transactions.filter(
    (t) => t.amount >= lower && t.amount < APPROVAL_THRESHOLD,
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
      triggeredRule: `split_expense: ≥2 笔金额落在 [${lower}, ${APPROVAL_THRESHOLD}) 的同一供应商支出`,
      evidence: {
        vendor,
        transactionIds: group.map((t) => t.id),
        amounts: group.map((t) => t.amount),
        total,
        count: group.length,
      },
      standardRef:
        "《中国注册会计师审计准则第 1211 号——识别和评估重大错报风险》（规避内部控制）",
      explanation: `供应商「${vendor}」存在 ${group.length} 笔接近审批阈值(${APPROVAL_THRESHOLD})的支出，合计 ${total}，疑似拆分报销以规避审批。`,
    });
  }
  return findings;
}
