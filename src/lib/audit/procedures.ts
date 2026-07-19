/** Suggested further audit procedures by risk type (Chinese CPA language). */

const DEFAULT_PROCS = [
  "询问相关人员了解交易背景与审批流程",
  "检查支持性文件（合同、发票、付款凭证）并与账面记录核对",
];

export const PROCEDURES_BY_RISK: Record<string, string[]> = {
  duplicate_payment: [
    "检查付款凭证与银行回单，确认是否实际重复支付",
    "重新执行供应商对账，核对发票号与付款记录唯一性",
    "询问财务是否存在冲销/退款未入账情形",
  ],
  missing_approval: [
    "检查授权审批矩阵，确认该金额级次所需审批人",
    "追查是否存在线下审批记录未录入系统",
    "评价审批控制设计与运行有效性（控制测试抽样）",
  ],
  split_expense: [
    "按供应商汇总临近阈值交易，评价是否存在规避审批意图",
    "检查业务实质是否为同一采购事项的拆分报销",
    "询问采购/报销人拆分原因并获取书面说明",
  ],
  abnormal_amount: [
    "与总体金额分布比较，确认是否为合理大额采购",
    "检查合同、验收单与付款支持文件的完整性",
    "考虑是否需将该供应商纳入扩大实质性测试范围",
  ],
  reconcile_unmatched_expense: [
    "向财务索取该报销对应的付款凭证或说明未付原因",
    "检查是否存在跨期付款或对公账户未入账",
  ],
  reconcile_orphan_payment: [
    "追查付款支持文件与审批链，确认业务实质",
    "与供应商对账，排除重复付款或错误支付",
  ],
  reconcile_amount_mismatch: [
    "核对发票、报销单与银行回单金额差异原因",
    "检查是否存在部分付款、折扣或汇率差异",
  ],
};

export function proceduresForRisk(riskType: string): string[] {
  return PROCEDURES_BY_RISK[riskType] ?? DEFAULT_PROCS;
}
