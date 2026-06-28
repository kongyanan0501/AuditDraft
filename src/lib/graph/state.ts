import { Annotation } from "@langchain/langgraph";

import type {
  AuditFinding,
  AuditReport,
  RiskLevel,
  Transaction,
} from "@/types/audit";

// LangGraph 共享 state。节点间只通过该 state 传递数据；调整流程只改图定义。
// 设计依据：src/lib/graph/AGENTS.md、ARCHITECTURE.md §4。

/** 工作流输入：可直接给已解析交易，或给原始 CSV 文本（parseData 负责归一）。 */
export interface AuditInput {
  transactions?: Transaction[];
  rawCsv?: string;
}

const lastValue = <T>(init: () => T) =>
  Annotation<T>({ reducer: (_prev, next) => next, default: init });

export const AuditStateAnnotation = Annotation.Root({
  /** 任务 id（落库 / 报告关联）。 */
  jobId: lastValue<string>(() => ""),
  /** 原始输入。 */
  input: lastValue<AuditInput>(() => ({})),
  /** parseData 产出的结构化交易。 */
  transactions: lastValue<Transaction[]>(() => []),
  /** auditPlanner 经 RAG 检索到的知识片段。 */
  knowledge: lastValue<string[]>(() => []),
  /** auditPlanner 产出的审计计划（Markdown）。 */
  plan: lastValue<string>(() => ""),
  /** ruleEngine 命中的确定性 finding。 */
  ruleFindings: lastValue<AuditFinding[]>(() => []),
  /** anomalyDetection 命中的离群 finding。 */
  anomalyFindings: lastValue<AuditFinding[]>(() => []),
  /** anomalyDetection 的 LLM 叙述性分析。 */
  anomalyAnalysis: lastValue<string>(() => ""),
  /** riskAssessment 汇总后的全部 finding。 */
  findings: lastValue<AuditFinding[]>(() => []),
  /** 整体风险等级（由 finding 严重度确定性推导）。 */
  riskLevel: lastValue<RiskLevel>(() => "low"),
  /** riskAssessment 的 LLM 评级说明 / 建议。 */
  riskNarrative: lastValue<string>(() => ""),
  /** workpaperGeneration 产出的底稿文本。 */
  workpaper: lastValue<string>(() => ""),
  /** reportExport 组装的最终报告。 */
  report: lastValue<AuditReport | null>(() => null),
});

export type AuditState = typeof AuditStateAnnotation.State;
