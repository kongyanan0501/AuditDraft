// 确定性规则引擎入口。每条规则是独立纯函数；这里只做「注册 + 编排执行」。
// 不依赖 LLM / 网络 IO —— 保证可靠、可复现、可单测。

import type { AuditFinding, Transaction } from "@/types/audit";

import { abnormalAmount } from "./abnormal-amount";
import { getRuleConfig, type RuleConfig } from "./config";
import { duplicatePayment } from "./duplicate-payment";
import { missingApproval } from "./missing-approval";
import { reconcileExpensePayments } from "./reconcile";
import { splitExpense } from "./split-expense";

export { APPROVAL_THRESHOLD } from "./missing-approval";
export {
  DEFAULT_RULE_CONFIG,
  getRuleConfig,
  mergeRuleConfig,
  type RuleConfig,
} from "./config";
export {
  abnormalAmount,
  duplicatePayment,
  missingApproval,
  reconcileExpensePayments,
  splitExpense,
};

/** 一条规则：输入交易 + 可选配置，输出可解释 finding 列表。 */
export type Rule = (
  transactions: Transaction[],
  config?: RuleConfig,
) => AuditFinding[];

export type RuleId =
  | "duplicate_payment"
  | "missing_approval"
  | "split_expense"
  | "abnormal_amount";

/** 规则注册表。新增规则 = 在此登记一个纯函数，调用方无需改动。 */
export const RULE_REGISTRY: Record<RuleId, Rule> = {
  duplicate_payment: (tx) => duplicatePayment(tx),
  missing_approval: missingApproval,
  split_expense: splitExpense,
  abnormal_amount: abnormalAmount,
};

export const ALL_RULE_IDS = Object.keys(RULE_REGISTRY) as RuleId[];

/**
 * 执行规则集合。默认跑全部规则；可传 ruleIds 仅跑子集；可传 config 覆盖阈值。
 */
export function runRules(
  transactions: Transaction[],
  ruleIds: RuleId[] = ALL_RULE_IDS,
  config: RuleConfig = getRuleConfig(),
): AuditFinding[] {
  return ruleIds.flatMap((id) => RULE_REGISTRY[id](transactions, config));
}
