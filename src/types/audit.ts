// 共享审计领域类型。整个系统（rules / graph / api / ui）统一消费这些结构。
// 设计依据：ARCHITECTURE.md §6（可解释性契约）。

export type RiskLevel = "low" | "medium" | "high";

export type JobStatus = "pending" | "running" | "done" | "failed";

/** 已知的确定性风险类型（规则引擎产出） */
export type RiskType =
  | "duplicate_payment"
  | "missing_approval"
  | "split_expense"
  | "abnormal_amount";

export type ReviewerStatus = "open" | "cleared" | "exception";

export type MaterialityImpact = "trivial" | "below_pm" | "above_pm";

/**
 * 可解释审计结论。任何风险结论都必须可序列化为该结构：
 * 禁止产出没有 triggeredRule / evidence 支撑的结论。
 */
export interface AuditFinding {
  riskType: RiskType | string;
  severity: RiskLevel;
  /** 触发的规则 / 判断依据 */
  triggeredRule: string;
  /** 命中的原始数据证据 */
  evidence: unknown;
  /** 引用的审计准则（通常来自 RAG） */
  standardRef?: string;
  /** 自然语言解释 */
  explanation: string;
  /** Stable id for review workflow */
  findingId?: string;
  rulesetVersion?: string;
  recommendedProcedures?: string[];
  materialityImpact?: MaterialityImpact;
  reviewerStatus?: ReviewerStatus;
  fraudRiskFlag?: boolean;
}

/** 一次审计任务的结构化交易记录（parseData 产出） */
export interface Transaction {
  id: string;
  vendor: string;
  amount: number;
  approver: string | null;
  invoiceId: string;
  [key: string]: unknown;
}

export type AuditTrailEvent = {
  at: string;
  event: string;
  detail?: string;
};

export type MaterialityConfig = {
  planningMateriality: number;
  performanceMateriality: number;
  trivialThreshold: number;
};

/** 最终落库到 audit_reports.report_json 的结构 */
export interface AuditReport {
  jobId: string;
  riskLevel: RiskLevel;
  findings: AuditFinding[];
  /** 生成的审计底稿文本（Markdown / 富文本） */
  workpaper: string;
  /** 运行元数据（降级 / 版本 / 重要性 / 轨迹） */
  meta?: {
    degraded?: boolean;
    llmSkipped?: boolean;
    mode?: "full" | "rules_only";
    rulesetVersion?: string;
    materiality?: MaterialityConfig;
    trail?: AuditTrailEvent[];
  };
}
