import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { AuditReport } from "@/types/audit";

// Word(.docx) 导出 — 事务所版式骨架（封面 / 索引 / 程序 / 发现 / 结论 / 免责）。
// 仅做序列化 / 排版，不做业务推理。

const RISK_LABEL: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const IMPACT_LABEL: Record<string, string> = {
  trivial: "明显微小",
  below_pm: "低于实际执行重要性",
  above_pm: "达到/超过实际执行重要性",
};

function findingParagraphs(report: AuditReport): Paragraph[] {
  if (report.findings.length === 0) {
    return [new Paragraph("未发现风险事项。")];
  }
  return report.findings.flatMap((f, i) => {
    const wpRef = `A-${i + 1}`;
    const procs = f.recommendedProcedures ?? [];
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun(
            `${wpRef} ${f.findingId ?? ""} ${f.riskType}（严重度：${RISK_LABEL[f.severity] ?? f.severity}）`,
          ),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "触发规则：", bold: true }),
          new TextRun(f.triggeredRule),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "数据证据：", bold: true }),
          new TextRun(JSON.stringify(f.evidence)),
        ],
      }),
      ...(f.standardRef
        ? [
            new Paragraph({
              children: [
                new TextRun({ text: "审计标准：", bold: true }),
                new TextRun(f.standardRef),
              ],
            }),
          ]
        : []),
      new Paragraph({
        children: [
          new TextRun({ text: "风险解释：", bold: true }),
          new TextRun(f.explanation),
        ],
      }),
      ...(f.materialityImpact
        ? [
            new Paragraph({
              children: [
                new TextRun({ text: "重要性影响：", bold: true }),
                new TextRun(
                  IMPACT_LABEL[f.materialityImpact] ?? f.materialityImpact,
                ),
              ],
            }),
          ]
        : []),
      ...(procs.length
        ? [
            new Paragraph({
              children: [new TextRun({ text: "建议进一步程序：", bold: true })],
            }),
            ...procs.map(
              (p) =>
                new Paragraph({
                  children: [new TextRun(`• ${p}`)],
                }),
            ),
          ]
        : []),
      new Paragraph({
        children: [
          new TextRun({ text: "复核状态：", bold: true }),
          new TextRun(f.reviewerStatus ?? "open"),
        ],
      }),
    ];
  });
}

function workpaperParagraphs(workpaper: string): Paragraph[] {
  if (!workpaper.trim()) return [new Paragraph("（无底稿正文）")];
  return workpaper
    .split(/\r?\n/)
    .map((line) => new Paragraph(line.length > 0 ? line : " "));
}

function indexParagraphs(report: AuditReport): Paragraph[] {
  if (report.findings.length === 0) {
    return [new Paragraph("无例外事项索引。")];
  }
  return report.findings.map(
    (f, i) =>
      new Paragraph(
        `A-${i + 1} ← ${f.findingId ?? `F-${i + 1}`} · ${f.riskType} · ${f.severity}`,
      ),
  );
}

/** 把审计报告渲染为 Word 文档 Buffer。 */
export async function exportWordReport(report: AuditReport): Promise<Buffer> {
  const mat = report.meta?.materiality;
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("审计工作底稿（费用循环）")],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "AI-assisted draft — subject to engagement review. 本底稿须经项目组复核后方可归档，不构成审计意见。",
                italics: true,
              }),
            ],
          }),
          new Paragraph(" "),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("封面信息")],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "工作底稿编号：", bold: true }),
              new TextRun(`WP-EXP-${report.jobId.slice(0, 8)}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "任务编号：", bold: true }),
              new TextRun(report.jobId),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "整体风险等级：", bold: true }),
              new TextRun(RISK_LABEL[report.riskLevel] ?? report.riskLevel),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "规则集版本：", bold: true }),
              new TextRun(report.meta?.rulesetVersion ?? "n/a"),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "运行模式：", bold: true }),
              new TextRun(report.meta?.mode ?? "full"),
            ],
          }),
          ...(mat
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "规划重要性：", bold: true }),
                    new TextRun(String(mat.planningMateriality)),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "实际执行重要性：", bold: true }),
                    new TextRun(String(mat.performanceMateriality)),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "明显微小错报临界值：", bold: true }),
                    new TextRun(String(mat.trivialThreshold)),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("一、工作底稿索引（例外事项）")],
          }),
          ...indexParagraphs(report),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("二、风险事项与建议程序")],
          }),
          ...findingParagraphs(report),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("三、审计底稿正文")],
          }),
          ...workpaperParagraphs(report.workpaper),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("四、结论与免责声明")],
          }),
          new Paragraph(
            "以上发现由确定性规则引擎初筛生成，建议程序供执行层参考。最终结论与是否调整审计策略须由项目组专业判断确定。",
          ),
          new Paragraph(
            "禁止用途：不得将本系统输出直接作为审计意见、监管报送或未经复核的对外结论。",
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
