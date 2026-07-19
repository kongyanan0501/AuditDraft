import { describe, expect, it, vi } from "vitest";

import { buildAuditGraph } from "@/lib/graph";
import type { LLMProvider } from "@/lib/llm/types";

import { DEMO_TRANSACTIONS } from "./fixtures";

function mockLLM(): LLMProvider {
  return {
    name: "mock",
    generate: vi.fn(async (prompt: string) => `MOCK_OUTPUT::${prompt.slice(0, 16)}`),
  };
}

describe("LangGraph 审计流程（mock LLM，无网络调用）", () => {
  it("以 mock LLM 跑通 7 节点并产出 AuditReport", async () => {
    const llm = mockLLM();
    const retrieve = vi.fn(async () => ["重复付款风险规则", "审批控制准则"]);

    const graph = buildAuditGraph({ llm, retrieve });
    const result = await graph.invoke({
      jobId: "job-test-1",
      input: { transactions: DEMO_TRANSACTIONS },
    });

    // parseData：交易正确流入
    expect(result.transactions).toHaveLength(4);
    // auditPlanner：调用了 RAG + LLM
    expect(retrieve).toHaveBeenCalled();
    expect(result.knowledge.length).toBeGreaterThan(0);
    expect(result.plan).toContain("MOCK_OUTPUT");
    // ruleEngine + anomalyDetection：确定性 findings
    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    // riskAssessment：整体风险取最高（演示数据含 high）
    expect(result.riskLevel).toBe("high");
    // workpaperGeneration
    expect(result.workpaper).toContain("MOCK_OUTPUT");
    // reportExport：最终报告结构完整
    expect(result.report).not.toBeNull();
    expect(result.report?.jobId).toBe("job-test-1");
    expect(result.report?.findings.length).toBe(result.findings.length);
    expect(result.report?.riskLevel).toBe("high");

    // 每条 finding 可解释（triggeredRule + evidence）
    for (const f of result.report!.findings) {
      expect(f.triggeredRule).toBeTruthy();
      expect(f.evidence).toBeDefined();
    }
  });

  it("支持从原始 CSV 输入解析", async () => {
    const graph = buildAuditGraph({ llm: mockLLM(), retrieve: async () => [] });
    const rawCsv = [
      "id,vendor,amount,approver,invoice_id",
      "1,ABC,5000,null,INV-1001",
      "2,ABC,5000,null,INV-1001",
    ].join("\n");

    const result = await graph.invoke({
      jobId: "job-csv",
      input: { rawCsv },
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.findings.some((f) => f.riskType === "duplicate_payment")).toBe(
      true,
    );
  });

  it("无交易数据时 parseData 抛错（任务应判失败）", async () => {
    const graph = buildAuditGraph({ llm: mockLLM(), retrieve: async () => [] });
    await expect(
      graph.invoke({ jobId: "job-empty", input: {} }),
    ).rejects.toThrow();
  });

  it("degraded=rules_only 不调用 LLM/RAG，仍产出可解释报告", async () => {
    const llm = mockLLM();
    const retrieve = vi.fn(async () => {
      throw new Error("retrieve must not be called in degraded mode");
    });

    const graph = buildAuditGraph({ llm, retrieve, degraded: true });
    const result = await graph.invoke({
      jobId: "job-degraded",
      input: { transactions: DEMO_TRANSACTIONS },
    });

    expect(llm.generate).not.toHaveBeenCalled();
    expect(retrieve).not.toHaveBeenCalled();
    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    expect(result.workpaper).toContain("降级");
    expect(result.report?.meta?.degraded).toBe(true);
    expect(result.report?.meta?.llmSkipped).toBe(true);
    for (const f of result.report!.findings) {
      expect(f.triggeredRule).toBeTruthy();
      expect(f.evidence).toBeDefined();
    }
  });
});
