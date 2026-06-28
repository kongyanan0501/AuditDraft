import type { LLMProvider } from "@/lib/llm/types";
import {
  buildExecutorPrompt,
  buildPlannerPrompt,
  buildRiskEnginePrompt,
  buildWorkpaperPrompt,
} from "@/lib/llm/prompts";
import { runRules } from "@/lib/rules";
import type { AuditFinding, AuditReport, RiskLevel } from "@/types/audit";

import { parseCsv } from "./parse";
import type { AuditState } from "./state";

// 审计工作流节点。职责分离（不得越界）：
// - auditPlanner / anomalyDetection / riskAssessment / workpaperGeneration → 调用 LLM(+RAG)。
// - ruleEngine / anomalyDetection 的命中判定 → 调用确定性规则纯函数。
// 节点以工厂方式注入依赖（llm / retrieve），便于用 mock 单测整张图。

/** 注入式依赖：解耦真实 LLM/RAG 与可测 mock。 */
export interface AuditGraphDeps {
  llm: LLMProvider;
  retrieve: (query: string) => Promise<string[]>;
}

const SEVERITY_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** 由 findings 严重度确定性推导整体风险等级（取最高）。 */
function deriveRiskLevel(findings: AuditFinding[]): RiskLevel {
  let level: RiskLevel = "low";
  for (const f of findings) {
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[level]) level = f.severity;
  }
  return level;
}

export function createNodes(deps: AuditGraphDeps) {
  /** 1. parseData：输入归一为 Transaction[]。 */
  async function parseData(state: AuditState): Promise<Partial<AuditState>> {
    const fromInput = state.input.transactions;
    const transactions =
      fromInput && fromInput.length > 0
        ? fromInput
        : state.input.rawCsv
          ? parseCsv(state.input.rawCsv)
          : [];

    if (transactions.length === 0) {
      throw new Error("parseData: 无可用交易数据（input 缺少 transactions / rawCsv）");
    }
    return { transactions };
  }

  /** 2. auditPlanner：RAG 检索 + LLM 生成审计计划。 */
  async function auditPlanner(state: AuditState): Promise<Partial<AuditState>> {
    const knowledge = await deps.retrieve(
      "审计计划 风险识别 重复付款 缺审批 拆分报销 异常金额",
    );
    const prompt = buildPlannerPrompt({
      transactions: state.transactions,
      knowledge,
    });
    const plan = await deps.llm.generate(prompt.user, {
      system: prompt.system,
    });
    return { knowledge, plan };
  }

  /** 3. ruleEngine：确定性规则检测（不依赖 LLM）。 */
  async function ruleEngine(state: AuditState): Promise<Partial<AuditState>> {
    const ruleFindings = runRules(state.transactions, [
      "duplicate_payment",
      "missing_approval",
      "split_expense",
    ]);
    return { ruleFindings };
  }

  /** 4. anomalyDetection：确定性离群检测 + LLM 异常叙述。 */
  async function anomalyDetection(
    state: AuditState,
  ): Promise<Partial<AuditState>> {
    const anomalyFindings = runRules(state.transactions, ["abnormal_amount"]);
    const interim = [...state.ruleFindings, ...anomalyFindings];
    const prompt = buildExecutorPrompt({
      transactions: state.transactions,
      findings: interim,
    });
    const anomalyAnalysis = await deps.llm.generate(prompt.user, {
      system: prompt.system,
    });
    return { anomalyFindings, anomalyAnalysis };
  }

  /** 5. riskAssessment：汇总 findings + 确定性风险评级 + LLM 评级说明。 */
  async function riskAssessment(
    state: AuditState,
  ): Promise<Partial<AuditState>> {
    const findings = [...state.ruleFindings, ...state.anomalyFindings];
    const riskLevel = deriveRiskLevel(findings);
    const prompt = buildRiskEnginePrompt({
      findings,
      overallRisk: riskLevel,
      knowledge: state.knowledge,
    });
    const riskNarrative = await deps.llm.generate(prompt.user, {
      system: prompt.system,
    });
    return { findings, riskLevel, riskNarrative };
  }

  /** 6. workpaperGeneration：LLM 生成标准审计底稿。 */
  async function workpaperGeneration(
    state: AuditState,
  ): Promise<Partial<AuditState>> {
    const prompt = buildWorkpaperPrompt({
      plan: state.plan,
      anomalyAnalysis: state.anomalyAnalysis,
      riskNarrative: state.riskNarrative,
      findings: state.findings,
      overallRisk: state.riskLevel,
    });
    const workpaper = await deps.llm.generate(prompt.user, {
      system: prompt.system,
    });
    return { workpaper };
  }

  /** 7. reportExport：组装最终 AuditReport（落库 / 文件导出在 run.ts 层完成）。 */
  async function reportExport(
    state: AuditState,
  ): Promise<Partial<AuditState>> {
    const report: AuditReport = {
      jobId: state.jobId,
      riskLevel: state.riskLevel,
      findings: state.findings,
      workpaper: state.workpaper,
    };
    return { report };
  }

  return {
    parseData,
    auditPlanner,
    ruleEngine,
    anomalyDetection,
    riskAssessment,
    workpaperGeneration,
    reportExport,
  };
}
