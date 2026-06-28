import "server-only";

import { getLLM } from "@/lib/llm";
import { retrieve } from "@/lib/rag";
import { saveReport, updateJobStatus } from "@/lib/supabase/repository";
import type { AuditReport } from "@/types/audit";

import { buildAuditGraph } from "./index";
import type { AuditInput } from "./state";

// 服务端工作流运行器：用真实 LLM/RAG/DB 跑通审计图，并维护任务状态机。
// 任一节点失败 → audit_jobs.status='failed'（满足 graph/AGENTS.md 约定）。

export async function runAuditWorkflow(
  jobId: string,
  input: AuditInput,
): Promise<AuditReport> {
  await updateJobStatus(jobId, "running");
  try {
    const graph = buildAuditGraph({ llm: getLLM(), retrieve });
    const result = await graph.invoke({ jobId, input });

    const report = result.report;
    if (!report) {
      throw new Error("runAuditWorkflow: 工作流结束但未产出 AuditReport");
    }

    await saveReport({ jobId, report });
    await updateJobStatus(jobId, "done");
    return report;
  } catch (err) {
    await updateJobStatus(jobId, "failed");
    throw err;
  }
}
