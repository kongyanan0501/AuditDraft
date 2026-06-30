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
  "输出务必专业、严谨、可归档，使用规范的中文审计语言，避免空话套话。";

// 可解释性硬约束：贯穿所有需要给结论的 prompt，禁止 LLM 编造无证据的新风险。
const EXPLAINABILITY_GUARD =
  "硬性要求：你不得新增任何「规则引擎未命中」的风险结论；" +
  "所有确定性结论以下方给定的 findings（含触发规则与证据）为唯一事实来源，" +
  "你只能对这些既定事实做专业解读、评级说明与建议。";

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
    .map((f, i) =>
      [
        `${i + 1}. [${f.severity.toUpperCase()}] ${f.riskType}`,
        `   触发规则：${f.triggeredRule}`,
        `   数据证据：${JSON.stringify(f.evidence)}`,
        f.standardRef ? `   审计准则：${f.standardRef}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
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
      `## 待审计交易数据（共 ${args.transactions.length} 笔，概览）`,
      summarizeTransactions(args.transactions),
      "",
      "## 可参考的审计知识（RAG 检索）",
      knowledgeBlock(args.knowledge),
      "",
      "## 任务",
      "结合上述数据特征（如审批缺失、金额聚集/离群、供应商集中度、发票号重复等），",
      "输出一份**结构化审计计划**，用 Markdown 分点，控制在 350 字以内：",
      "1. **重点风险领域**：列出 3-5 个，每个一句话说明为何由这批数据触发；",
      "2. **拟执行审计程序**：每个风险领域对应 1-2 条可操作程序；",
      "3. **重点核验字段/凭证**：列出需调阅的原始单据与字段。",
      "不要下最终风险结论（结论由后续规则引擎确定）。",
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
    system: `${AUDITOR_PERSONA}\n本步骤：异常分析。\n${EXPLAINABILITY_GUARD}`,
    user: [
      "## 交易数据",
      summarizeTransactions(args.transactions),
      "",
      "## 规则引擎已确定命中的风险（既定事实，不可增删）",
      summarizeFindings(args.findings),
      "",
      "## 任务",
      "基于以上既定事实，分析数据中的异常模式并解释其审计含义，控制在 300 字以内：",
      "- 围绕已命中的 findings 展开（金额聚集/离群、审批缺失分布、供应商集中度、发票号重复等）；",
      "- 说明这些异常为何指向舞弊或内控失效；",
      "- 如多条 finding 相互印证，请点明其关联。",
      "用简洁的 Markdown 段落输出，只做解读，不新增无证据的结论。",
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
    system: `${AUDITOR_PERSONA}\n本步骤：风险评级说明与内控建议。\n${EXPLAINABILITY_GUARD}\n注意：整体风险等级由系统确定性推导，你负责解释其合理性，不得擅自改判。`,
    user: [
      `## 系统判定的整体风险等级：${args.overallRisk.toUpperCase()}`,
      "（取所有 findings 的最高 severity，确定性推导，不可更改）",
      "",
      "## 已命中风险清单（含触发规则、证据、准则）",
      summarizeFindings(args.findings),
      "",
      "## 可参考的审计准则（RAG 检索）",
      knowledgeBlock(args.knowledge),
      "",
      "## 任务（Markdown 分点，控制在 400 字以内）",
      "1. **评级合理性**：结合最高 severity 的具体 finding，说明该整体等级为何成立；",
      "2. **内控缺陷**：指出这批风险暴露出的关键控制点失效（如审批授权、发票唯一性校验）；",
      "3. **审计建议/整改**：给出可落地的整改措施与后续审计应对程序。",
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
    system: `${AUDITOR_PERSONA}\n本步骤：撰写标准审计工作底稿，语言专业、结构清晰、可直接归档。\n${EXPLAINABILITY_GUARD}`,
    user: [
      "请整合以下材料，生成一份**完整、可直接归档的审计工作底稿**（Markdown），严格按以下章节组织：",
      "",
      "# 审计工作底稿",
      "## 一、审计概述（审计对象、范围、整体风险等级）",
      "## 二、审计程序（实际执行的审计步骤）",
      "## 三、发现的风险事项",
      "（**逐条**列出每个 finding，每条必须包含：风险类型与等级 / 触发规则 / 数据证据 / 审计准则引用 / 风险解释——不得省略证据）",
      "## 四、风险评级与内控评价",
      "## 五、审计结论与建议",
      "",
      "要求：第三章每条风险事项必须忠实保留下方给定的触发规则与证据，禁止改写或编造；语言简洁专业。",
      "",
      "---",
      `## [素材] 整体风险等级\n${args.overallRisk.toUpperCase()}`,
      "",
      `## [素材] 审计计划\n${args.plan}`,
      "",
      `## [素材] 异常分析\n${args.anomalyAnalysis}`,
      "",
      `## [素材] 风险评级说明\n${args.riskNarrative}`,
      "",
      "## [素材] 已确认风险事项（必须逐条体现，保留触发规则与证据）",
      summarizeFindings(args.findings),
    ].join("\n"),
  };
}
