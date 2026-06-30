// RAG 种子知识库（纯数据，无副作用 / 无别名导入，便于脚本与应用复用）。
// 覆盖四类知识：审计准则 / 风险规则 / 审计程序 / 舞弊案例。
// 用 `.ts` 显式扩展名导入类型，保证可被 node 原生 TS 直接运行的 seed 脚本引用。

import type { KnowledgeItem } from "./types.ts";

export const SEED_KNOWLEDGE: KnowledgeItem[] = [
  // ── 风险规则 ──────────────────────────────────────────────
  {
    id: "rule-duplicate-payment",
    type: "risk_rule",
    content:
      "同一供应商 + 相同金额 + 相同发票号出现多笔记录，构成重复付款 / 重复发票风险，属高风险舞弊信号。",
    risk_level: "high",
    tags: ["fraud", "duplicate", "payment"],
  },
  {
    id: "rule-missing-approval",
    type: "risk_rule",
    content:
      "大额支出（金额超过审批阈值，如 10000）缺少审批人，属未授权支出，反映审批控制失效。",
    risk_level: "high",
    tags: ["control", "approval", "authorization"],
  },
  {
    id: "rule-split-expense",
    type: "risk_rule",
    content:
      "同一供应商出现多笔金额刚好低于审批阈值的支出，疑似拆分报销以规避审批控制。",
    risk_level: "medium",
    tags: ["control", "split", "circumvention"],
  },
  {
    id: "rule-abnormal-amount",
    type: "risk_rule",
    content:
      "交易金额显著偏离总体均值（统计离群，z-score 超过阈值，如 |z|>2），需关注异常大额或异常小额交易的合理性，警惕虚增费用或资金转移。",
    risk_level: "medium",
    tags: ["anomaly", "amount", "outlier"],
  },
  {
    id: "rule-approval-threshold",
    type: "risk_rule",
    content:
      "审批阈值是关键内控参数：金额达到或超过阈值（如 10000）必须经授权审批；缺审批或贴边规避（金额刚好低于阈值）均为审批控制失效信号。",
    risk_level: "high",
    tags: ["control", "approval", "threshold"],
  },
  // ── 审计准则 ──────────────────────────────────────────────
  {
    id: "std-internal-control",
    type: "audit_standard",
    content:
      "《中国注册会计师审计准则第 1211 号——通过了解被审计单位及其环境识别和评估重大错报风险》要求评价内部控制设计与执行有效性，关注审批授权等关键控制点。",
    tags: ["standard", "internal_control", "risk_assessment"],
  },
  {
    id: "std-fraud",
    type: "audit_standard",
    content:
      "《中国注册会计师审计准则第 1141 号——财务报表审计中与舞弊相关的责任》要求保持职业怀疑，对重复付款、虚构交易等舞弊迹象保持警觉。",
    tags: ["standard", "fraud"],
  },
  {
    id: "std-analytical-procedure",
    type: "audit_standard",
    content:
      "《中国注册会计师审计准则第 1313 号——分析程序》要求通过研究数据间的内在关系（如金额离群、趋势异常、比率波动）识别可能存在重大错报的异常波动。",
    tags: ["standard", "analytical", "anomaly"],
  },
  {
    id: "std-misstatement-response",
    type: "audit_standard",
    content:
      "《中国注册会计师审计准则第 1231 号——针对评估的重大错报风险采取的应对措施》要求针对识别出的风险设计并执行进一步审计程序，风险越高应对越充分。",
    tags: ["standard", "risk_response"],
  },
  // ── 审计程序 ──────────────────────────────────────────────
  {
    id: "proc-payment-test",
    type: "audit_procedure",
    content:
      "付款循环测试：抽取付款明细，核对供应商、金额、发票号与审批单据，检查是否存在重复付款、缺审批、拆分等异常。",
    tags: ["procedure", "payment", "testing"],
  },
  {
    id: "proc-approval-walkthrough",
    type: "audit_procedure",
    content:
      "审批控制穿行测试：选取大额支出，追查审批流程证据，验证授权审批控制是否有效执行。",
    tags: ["procedure", "approval", "walkthrough"],
  },
  {
    id: "proc-analytical-review",
    type: "audit_procedure",
    content:
      "金额分析性复核：计算费用/付款金额的均值与离散度，识别离群大额或异常小额交易，对偏离总体的项目追加实质性测试与凭证核对。",
    tags: ["procedure", "analytical", "amount"],
  },
  // ── 舞弊案例 ──────────────────────────────────────────────
  {
    id: "case-duplicate-invoice",
    type: "fraud_case",
    content:
      "某公司采购人员用同一张发票重复提交付款申请，因系统未校验发票号唯一性导致重复付款，造成资金损失——典型重复发票舞弊。",
    risk_level: "high",
    tags: ["case", "duplicate", "invoice", "fraud"],
  },
  {
    id: "case-split-reimbursement",
    type: "fraud_case",
    content:
      "某部门负责人将一笔大额采购拆分为多笔低于审批权限的支出报销，规避上级审批，属典型拆分报销规避控制案例。",
    risk_level: "medium",
    tags: ["case", "split", "circumvention"],
  },
  {
    id: "case-abnormal-large-payment",
    type: "fraud_case",
    content:
      "某企业出现一笔金额远超日常水平的供应商付款，事后查实为虚构采购套取资金；金额离群是该舞弊最早暴露的信号，凸显金额分析性复核的价值。",
    risk_level: "high",
    tags: ["case", "anomaly", "amount", "fraud"],
  },
];
