import { existsSync } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import type { AuditFinding, AuditReport } from "@/types/audit";

// PDF 导出。pdfkit 内置 Helvetica 仅支持 WinAnsi（拉丁），无法呈现中文。
// 若提供 CJK 字体（PDF_CJK_FONT_PATH 或 src/lib/export/fonts/*.ttf），则注册后完整渲染中文；
// 否则降级：把非拉丁字符替换为 "?"，保证 PDF 仍可生成并打开（结构 / 证据 / 数字仍可读）。
// 注：完整中文归档场景推荐使用 Word 导出。

const RISK_LABEL: Record<string, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

function resolveCjkFont(): string | null {
  const fromEnv = process.env.PDF_CJK_FONT_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const bundled = path.join(process.cwd(), "src/lib/export/fonts/cjk.ttf");
  if (existsSync(bundled)) return bundled;
  return null;
}

/** 无 CJK 字体时，剔除 WinAnsi 无法编码的字符，避免 pdfkit 抛错。 */
function sanitize(text: string, hasCjkFont: boolean): string {
  if (hasCjkFont) return text;
  return text.replace(/[^\u0000-\u00ff]/g, "?");
}

function findingLines(report: AuditReport, hasFont: boolean): string[] {
  if (report.findings.length === 0) return ["No risk findings."];
  return report.findings.flatMap((f: AuditFinding, i) => [
    `${i + 1}. ${f.riskType} [${f.severity}]`,
    `   triggeredRule: ${f.triggeredRule}`,
    `   evidence: ${JSON.stringify(f.evidence)}`,
    ...(f.standardRef ? [`   standardRef: ${f.standardRef}`] : []),
    `   explanation: ${sanitize(f.explanation, hasFont)}`,
  ]);
}

/** 把审计报告渲染为 PDF Buffer。 */
export function exportPdfReport(report: AuditReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const fontPath = resolveCjkFont();
    const hasFont = fontPath !== null;

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      if (fontPath) doc.registerFont("cjk", fontPath).font("cjk");

      const s = (t: string) => sanitize(t, hasFont);

      doc.fontSize(20).text(s("审计工作底稿 / Audit Workpaper"));
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Job: ${report.jobId}`);
      doc.text(`Overall risk: ${RISK_LABEL[report.riskLevel] ?? report.riskLevel}`);
      doc.moveDown();

      doc.fontSize(14).text(s("一、风险事项 / Findings"));
      doc.moveDown(0.3);
      doc.fontSize(10);
      for (const line of findingLines(report, hasFont)) {
        doc.text(line);
      }

      doc.moveDown();
      doc.fontSize(14).text(s("二、审计底稿正文 / Workpaper"));
      doc.moveDown(0.3);
      doc.fontSize(10).text(s(report.workpaper || "（无底稿正文）"));

      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
