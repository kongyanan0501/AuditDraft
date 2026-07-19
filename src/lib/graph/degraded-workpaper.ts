import type { AuditFinding, RiskLevel } from "@/types/audit";

/** Template workpaper when LLM is skipped (AUDIT_DEGRADED_MODE=rules_only). */
export function buildRulesOnlyWorkpaper(input: {
  riskLevel: RiskLevel;
  findings: AuditFinding[];
  planNote?: string;
}): string {
  const { riskLevel, findings, planNote } = input;
  const preparedAt = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    "# 审计工作底稿（规则引擎降级模式）",
    "",
    "> **降级声明**：本底稿由确定性规则引擎生成骨架，**未调用 LLM**。",
    "> 输出为 AI-assisted draft，须经项目组复核后方可归档。",
    "",
    "## 封面与签核",
    "",
    "| 项目 | 内容 |",
    "| --- | --- |",
    "| 审计循环 | 费用与报销（Expense cycle） |",
    "| 被审计期间 | 【待项目组填写】 |",
    `| 整体风险等级 | ${riskLevel.toUpperCase()} |`,
    "| 编制人（Prepared by） | AuditDraft AI（草稿） / ______________ |",
    `| 编制日期 | ${preparedAt} |`,
    "| 复核人（Reviewed by） | ______________ |",
    "| 复核日期 | ______________ |",
    "",
    "## 1. 审计概述",
    "",
    planNote ??
      "本次以费用/报销循环为范围，执行重复付款、缺审批、拆分报销、金额离群等确定性检测。",
    "",
    "## 2. 已执行程序对照表",
    "",
    "| 程序号 | 程序目标 | 执行方式 | 结果 |",
    "| --- | --- | --- | --- |",
  ];

  const counts = new Map<string, number>();
  for (const f of findings) {
    const key = String(f.riskType);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const procs: { id: string; objective: string; method: string; riskType: string }[] =
    [
      {
        id: "P-1",
        objective: "识别重复付款",
        method: "duplicate_payment",
        riskType: "duplicate_payment",
      },
      {
        id: "P-2",
        objective: "识别无审批大额",
        method: "missing_approval",
        riskType: "missing_approval",
      },
      {
        id: "P-3",
        objective: "识别拆分报销",
        method: "split_expense",
        riskType: "split_expense",
      },
      {
        id: "P-4",
        objective: "识别金额离群",
        method: "abnormal_amount",
        riskType: "abnormal_amount",
      },
    ];

  for (const proc of procs) {
    const n = counts.get(proc.riskType) ?? 0;
    const result = n > 0 ? `例外 ${n} 条` : "未发现例外";
    lines.push(
      `| ${proc.id} | ${proc.objective} | ${proc.method} | ${result} |`,
    );
  }
  lines.push("");

  lines.push("## 3. 风险事项（例外明细）", "");

  if (findings.length === 0) {
    lines.push("未发现规则命中事项。", "");
  } else {
    findings.forEach((f, i) => {
      lines.push(`### A-${i + 1} · ${f.riskType}（${f.severity}）`);
      lines.push("");
      lines.push(`- **Finding ID**：${f.findingId ?? `F-${i + 1}`}`);
      lines.push(`- **触发规则**：${f.triggeredRule}`);
      lines.push(`- **解释**：${f.explanation}`);
      if (f.standardRef) lines.push(`- **准则引用**：${f.standardRef}`);
      lines.push(`- **证据**：\`${JSON.stringify(f.evidence)}\``);
      lines.push(`- **复核状态**：${f.reviewerStatus ?? "open"}`);
      lines.push("");
    });
  }

  lines.push("## 4. 工作底稿索引（例外）", "");
  if (findings.length === 0) {
    lines.push("无。", "");
  } else {
    lines.push("| W/P | Finding ID | 风险类型 | 严重度 |");
    lines.push("| --- | --- | --- | --- |");
    findings.forEach((f, i) => {
      lines.push(
        `| A-${i + 1} | ${f.findingId ?? `F-${i + 1}`} | ${f.riskType} | ${f.severity} |`,
      );
    });
    lines.push("");
  }

  lines.push(
    "## 5. 待 LLM 增强的章节（占位）",
    "",
    "- 详细审计计划叙述",
    "- 内控评价与建议的自然语言扩写",
    "- 合伙人摘要润色",
    "",
    "## 6. 结论与免责",
    "",
    "规则引擎已完成可复现的硬性检测。建议对 high 级事项执行进一步查证程序，并在完整模式下（关闭降级）生成正式底稿文本。",
    "",
    "**AI-assisted draft — subject to engagement review.** 不构成审计意见。",
    "",
  );

  return lines.join("\n");
}
