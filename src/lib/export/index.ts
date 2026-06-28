// 导出层入口。输入结构化 AuditReport，输出 Word / PDF 文件 Buffer。
// 仅做序列化 / 排版，不做业务推理（推理在 graph / rules / llm）。

import type { AuditReport } from "@/types/audit";

import { exportPdfReport } from "./pdf";
import { exportWordReport } from "./word";

export { exportPdfReport } from "./pdf";
export { exportWordReport } from "./word";

export type ExportFormat = "word" | "pdf";

export interface ExportedFile {
  format: ExportFormat;
  filename: string;
  contentType: string;
  buffer: Buffer;
}

const META: Record<
  ExportFormat,
  { ext: string; contentType: string; render: (r: AuditReport) => Promise<Buffer> }
> = {
  word: {
    ext: "docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    render: exportWordReport,
  },
  pdf: {
    ext: "pdf",
    contentType: "application/pdf",
    render: exportPdfReport,
  },
};

/** 按格式导出审计报告，返回文件元信息 + Buffer。 */
export async function exportReport(
  report: AuditReport,
  format: ExportFormat,
): Promise<ExportedFile> {
  const meta = META[format];
  const buffer = await meta.render(report);
  return {
    format,
    filename: `audit-report-${report.jobId}.${meta.ext}`,
    contentType: meta.contentType,
    buffer,
  };
}
