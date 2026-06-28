import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { AuditReport } from "@/types/audit";

// Word(.docx) 导出。docx 原生支持 Unicode，可完整呈现中文底稿。
// 仅做序列化 / 排版，不做业务推理。

const RISK_LABEL: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

function findingParagraphs(report: AuditReport): Paragraph[] {
  if (report.findings.length === 0) {
    return [new Paragraph("未发现风险事项。")];
  }
  return report.findings.flatMap((f, i) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [
        new TextRun(
          `${i + 1}. ${f.riskType}（严重度：${RISK_LABEL[f.severity] ?? f.severity}）`,
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
  ]);
}

function workpaperParagraphs(workpaper: string): Paragraph[] {
  if (!workpaper.trim()) return [new Paragraph("（无底稿正文）")];
  return workpaper
    .split(/\r?\n/)
    .map((line) => new Paragraph(line.length > 0 ? line : " "));
}

/** 把审计报告渲染为 Word 文档 Buffer。 */
export async function exportWordReport(report: AuditReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("审计工作底稿")],
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
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("一、风险事项")],
          }),
          ...findingParagraphs(report),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("二、审计底稿正文")],
          }),
          ...workpaperParagraphs(report.workpaper),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
