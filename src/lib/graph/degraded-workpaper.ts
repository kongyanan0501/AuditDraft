import type { AuditFinding, RiskLevel } from "@/types/audit";

/** Template workpaper when LLM is skipped (AUDIT_DEGRADED_MODE=rules_only). */
export function buildRulesOnlyWorkpaper(input: {
  riskLevel: RiskLevel;
  findings: AuditFinding[];
  planNote?: string;
}): string {
  const { riskLevel, findings, planNote } = input;
  const lines: string[] = [
    "# 审计工作底稿（规则引擎降级模式）",
    "",
    "> **降级声明**：本底稿由确定性规则引擎生成骨架，**未调用 LLM**。",
    "> 输出为 AI-assisted draft，须经项目组复核后方可归档。",
    "",
    "## 1. 审计概述",
    "",
    planNote ??
      "本次以费用/报销循环为范围，执行重复付款、缺审批、拆分报销、金额离群等确定性检测。",
    "",
    `**整体风险等级**：${riskLevel.toUpperCase()}`,
    "",
    "## 2. 审计程序（已执行）",
    "",
    "- 解析上传交易明细",
    "- 运行规则包 `rules-v1`（duplicate_payment / missing_approval / split_expense / abnormal_amount）",
    "- 汇总可解释 findings（triggeredRule / evidence / standardRef / explanation）",
    "",
    "## 3. 风险事项",
    "",
  ];

  if (findings.length === 0) {
    lines.push("未发现规则命中事项。", "");
  } else {
    findings.forEach((f, i) => {
      lines.push(`### 3.${i + 1} ${f.riskType}（${f.severity}）`);
      lines.push("");
      lines.push(`- **触发规则**：${f.triggeredRule}`);
      lines.push(`- **解释**：${f.explanation}`);
      if (f.standardRef) lines.push(`- **准则引用**：${f.standardRef}`);
      lines.push(`- **证据**：\`${JSON.stringify(f.evidence)}\``);
      lines.push("");
    });
  }

  lines.push(
    "## 4. 待 LLM 增强的章节（占位）",
    "",
    "- 详细审计计划叙述",
    "- 内控评价与建议的自然语言扩写",
    "- 合伙人摘要润色",
    "",
    "## 5. 结论",
    "",
    "规则引擎已完成可复现的硬性检测。建议对 high 级事项执行进一步查证程序，并在完整模式下（关闭降级）生成正式底稿文本。",
    "",
  );

  return lines.join("\n");
}
