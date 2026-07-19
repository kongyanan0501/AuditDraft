import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import { exportPdfReport, exportReport, exportWordReport } from "@/lib/export";
import type { AuditReport } from "@/types/audit";

const SAMPLE: AuditReport = {
  jobId: "job-export-1",
  riskLevel: "high",
  findings: [
    {
      riskType: "duplicate_payment",
      severity: "high",
      findingId: "F-DUP-1",
      triggeredRule: "duplicate_payment: same vendor + same amount + same invoiceId",
      evidence: { vendor: "ABC", transactionIds: ["1", "2"] },
      standardRef: "审计准则 1141",
      explanation: "供应商 ABC 存在重复付款。",
      recommendedProcedures: ["检查付款凭证与银行回单"],
      materialityImpact: "above_pm",
      reviewerStatus: "open",
    },
  ],
  workpaper: "一、审计概述\n本次审计发现重复付款风险。\n二、审计结论\n建议核查。",
  meta: {
    mode: "rules_only",
    rulesetVersion: "rules-v1",
    materiality: {
      planningMateriality: 100000,
      performanceMateriality: 75000,
      trivialThreshold: 5000,
    },
  },
};

async function wordXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("missing word/document.xml");
  return xml;
}

describe("导出层（Word / PDF）", () => {
  it("Word 导出为合法 .docx（ZIP 魔数 PK）", async () => {
    const buffer = await exportWordReport(SAMPLE);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("Word 含档 A 底稿结构：签核 / 索引 / 程序对照 / 例外明细", async () => {
    const buffer = await exportWordReport(SAMPLE);
    const xml = await wordXml(buffer);

    expect(xml).toContain("封面与签核");
    expect(xml).toContain("编制人");
    expect(xml).toContain("复核人");
    expect(xml).toContain("工作底稿索引");
    expect(xml).toContain("已执行程序对照表");
    expect(xml).toContain("例外事项明细");
    expect(xml).toContain("A-1");
    expect(xml).toContain("F-DUP-1");
    expect(xml).toContain("P-1");
    expect(xml).toContain("WP-EXP-job-expo");
    expect(xml).toContain("AI-assisted draft");
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
