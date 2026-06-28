// Prompt 工程四件套：Audit Planner / Audit Executor / Risk Engine / Workpaper Generator。
// 集中管理、可版本化复用。纯函数，不依赖任何 SDK；graph 节点据此构造 LLMProvider 输入。
// 设计依据：docs/architecture/ai-system.md §5。
//
// 硬约束（可解释性）：LLM 只负责「理解 / 表达 / 建议」。
// 确定性结论（findings 的 triggeredRule / evidence）一律来自规则引擎，
// 不允许 LLM 凭空产出无证据结论 —— 因此 prompt 始终把已命中的 findings 作为既定事实喂入。

import type { AuditFinding, Transaction } from "@/types/audit";

export interface PromptInput {
  system: string;
  user: string;
}

const AUDITOR_PERSONA =
  "你是一名资深注册会计师（CPA），精通财务报表审计、内控评价与舞弊识别。" +
  "输出务必专业、严谨、可归档，使用规范的中文审计语言。";

/** 把交易压缩成紧凑的表格文本，控制 token 体积。 */
function summarizeTransactions(transactions: Transaction[]): string {
  const header = "id | vendor | amount | approver | invoiceId";
  const rows = transactions
    .map(
      (t) =>
        `${t.id} | ${t.vendor} | ${t.amount} | ${t.approver ?? "null"} | ${t.invoiceId}`,
    )
    .join("\n");
  return `${header}\n${rows}`;
}

function summarizeFindings(findings: AuditFinding[]): string {
  if (findings.length === 0) return "（规则引擎未命中任何确定性风险）";
  return findings
    .map(
      (f, i) =>
        `${i + 1}. [${f.severity}] ${f.riskType} — 触发规则：${f.triggeredRule}；证据：${JSON.stringify(
          f.evidence,
        )}`,
    )
    .join("\n");
}

function knowledgeBlock(knowledge: string[]): string {
  if (knowledge.length === 0) return "（无检索到的知识，凭专业判断）";
  return knowledge.map((k, i) => `[K${i + 1}] ${k}`).join("\n");
}

/**
 * Audit Planner：基于交易概览与 RAG 知识，产出结构化审计计划
 * （重点关注领域 + 拟执行的审计程序）。
 */
export function buildPlannerPrompt(args: {
  transactions: Transaction[];
  knowledge: string[];
}): PromptInput {
  return {
    system: `${AUDITOR_PERSONA}\n本步骤：制定审计计划（风险识别 + 审计程序），不要下最终结论。`,
    user: [
      "## 待审计交易数据（概览）",
      summarizeTransactions(args.transactions),
      "",
      "## 可参考的审计知识（RAG 检索）",
      knowledgeBlock(args.knowledge),
      "",
      "## 任务",
      "请输出一份结构化审计计划，包含：",
      "1. 重点关注的风险领域（结合上述数据特征）；",
      "2. 针对每个风险领域拟执行的审计程序；",
      "3. 需要重点核验的字段 / 凭证。",
      "用 Markdown 分点输出。",
    ].join("\n"),
  };
}

/**
 * Audit Executor：在确定性规则结果之上做异常分析与数据解读。
 * 仅产出叙述性分析，不得编造无证据的新结论。
 */
export function buildExecutorPrompt(args: {
  transactions: Transaction[];
  findings: AuditFinding[];
}): PromptInput {
  return {
    system: `${AUDITOR_PERSONA}\n本步骤：异常分析。只能基于给定数据与已命中规则结论展开，禁止臆造无证据的结论。`,
    user: [
      "## 交易数据",
      summarizeTransactions(args.transactions),
      "",
      "## 规则引擎已确定命中的风险（既定事实）",
      summarizeFindings(args.findings),
      "",
      "## 任务",
      "基于以上信息，分析数据中的异常模式（如金额聚集、审批缺失分布、供应商集中度等），",
      "解释这些异常为何值得审计关注。只做分析与解读，不要新增没有数据证据的结论。",
      "用简洁的 Markdown 段落输出。",
    ].join("\n"),
  };
}

/**
 * Risk Engine：风险评级理由、内控判断与审计建议。
 * 最终风险等级由规则引擎确定，本步骤给出专业解释与建议。
 */
export function buildRiskEnginePrompt(args: {
  findings: AuditFinding[];
  overallRisk: string;
  knowledge: string[];
}): PromptInput {
  return {
    system: `${AUDITOR_PERSONA}\n本步骤：风险评级说明与内控建议。`,
    user: [
      `## 系统判定的整体风险等级：${args.overallRisk}`,
      "",
      "## 已命中风险清单（含证据）",
      summarizeFindings(args.findings),
      "",
      "## 可参考的审计准则（RAG 检索）",
      knowledgeBlock(args.knowledge),
      "",
      "## 任务",
      "1. 说明整体风险等级判定的合理性（结合具体 finding）；",
      "2. 指出反映出的内控缺陷；",
      "3. 给出可执行的审计建议 / 整改措施。",
      "用 Markdown 分点输出。",
    ].join("\n"),
  };
}

/**
 * Workpaper Generator：生成可归档的标准审计底稿。
 */
export function buildWorkpaperPrompt(args: {
  plan: string;
  anomalyAnalysis: string;
  riskNarrative: string;
  findings: AuditFinding[];
  overallRisk: string;
}): PromptInput {
  return {
    system: `${AUDITOR_PERSONA}\n本步骤：撰写标准审计工作底稿，语言专业、结构清晰、可直接归档。`,
    user: [
      "请整合以下内容，生成一份完整的审计工作底稿（Markdown）。",
      "结构建议：一、审计概述；二、审计程序；三、发现的风险事项（逐条列出触发规则与证据）；",
      "四、风险评级与内控评价；五、审计结论与建议。",
      "",
      `## 整体风险等级\n${args.overallRisk}`,
      "",
      `## 审计计划\n${args.plan}`,
      "",
      `## 异常分析\n${args.anomalyAnalysis}`,
      "",
      `## 风险评级说明\n${args.riskNarrative}`,
      "",
      "## 已确认风险事项（必须逐条体现，保留触发规则与证据）",
      summarizeFindings(args.findings),
    ].join("\n"),
  };
}
