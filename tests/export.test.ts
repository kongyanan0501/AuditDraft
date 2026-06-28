import { describe, expect, it } from "vitest";

import { exportPdfReport, exportReport, exportWordReport } from "@/lib/export";
import type { AuditReport } from "@/types/audit";

const SAMPLE: AuditReport = {
  jobId: "job-export-1",
  riskLevel: "high",
  findings: [
    {
      riskType: "duplicate_payment",
      severity: "high",
      triggeredRule: "duplicate_payment: same vendor + same amount + same invoiceId",
      evidence: { vendor: "ABC", transactionIds: ["1", "2"] },
      standardRef: "审计准则 1141",
      explanation: "供应商 ABC 存在重复付款。",
    },
  ],
  workpaper: "一、审计概述\n本次审计发现重复付款风险。\n二、审计结论\n建议核查。",
};

describe("导出层（Word / PDF）", () => {
  it("Word 导出为合法 .docx（ZIP 魔数 PK）", async () => {
    const buffer = await exportWordReport(SAMPLE);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("PDF 导出为合法 .pdf（魔数 %PDF）", async () => {
    const buffer = await exportPdfReport(SAMPLE);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("exportReport 返回正确文件元信息", async () => {
    const word = await exportReport(SAMPLE, "word");
    expect(word.filename).toBe("audit-report-job-export-1.docx");
    expect(word.contentType).toContain("wordprocessingml");

    const pdf = await exportReport(SAMPLE, "pdf");
    expect(pdf.filename).toBe("audit-report-job-export-1.pdf");
    expect(pdf.contentType).toBe("application/pdf");
  });
});
