// 确定性规则引擎入口。每条规则是独立纯函数；这里只做「注册 + 编排执行」。
// 不依赖 LLM / 网络 IO —— 保证可靠、可复现、可单测。
// 设计依据：docs/architecture/ai-system.md §3、ARCHITECTURE.md §5/§6。

import type { AuditFinding, Transaction } from "@/types/audit";

import { abnormalAmount } from "./abnormal-amount";
import { duplicatePayment } from "./duplicate-payment";
import { missingApproval } from "./missing-approval";
import { splitExpense } from "./split-expense";

export { APPROVAL_THRESHOLD } from "./missing-approval";
export { abnormalAmount, duplicatePayment, missingApproval, splitExpense };

/** 一条规则：输入交易，输出可解释 finding 列表。 */
export type Rule = (transactions: Transaction[]) => AuditFinding[];

export type RuleId =
  | "duplicate_payment"
  | "missing_approval"
  | "split_expense"
  | "abnormal_amount";

/** 规则注册表。新增规则 = 在此登记一个纯函数，调用方无需改动。 */
export const RULE_REGISTRY: Record<RuleId, Rule> = {
  duplicate_payment: duplicatePayment,
  missing_approval: missingApproval,
  split_expense: splitExpense,
  abnormal_amount: abnormalAmount,
};

export const ALL_RULE_IDS = Object.keys(RULE_REGISTRY) as RuleId[];

/**
 * 执行规则集合。默认跑全部规则；可传 ruleIds 仅跑子集（供 graph 不同节点选用）。
 * 输出汇总后的 AuditFinding[]，每个 finding 必带 triggeredRule / evidence。
 */
export function runRules(
  transactions: Transaction[],
  ruleIds: RuleId[] = ALL_RULE_IDS,
): AuditFinding[] {
  return ruleIds.flatMap((id) => RULE_REGISTRY[id](transactions));
}
