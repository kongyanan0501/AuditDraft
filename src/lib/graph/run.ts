import "server-only";

import { isAuditDegradedMode } from "@/lib/env";
import { getLLM } from "@/lib/llm";
import type { LLMProvider } from "@/lib/llm/types";
import { parseAuditFile } from "@/lib/parse";
import { retrieve } from "@/lib/rag";
import {
  workerDownloadFile,
  workerGetJob,
  workerSaveRawData,
  workerSaveReport,
  workerUpdateJobStatus,
} from "@/lib/supabase/worker-repository";

import { buildAuditGraph } from "./index";

// 服务端审计工作流运行器（后台执行）。
// 串联：下载文件 → 解析 → LangGraph(7 节点) → 报告落库；并维护任务状态机：
//   running → done / failed（任一步失败 → failed 且记录可读错误）。
// 用 admin 客户端读写（脱离请求作用域）；归属校验在 /api/audit 已完成。
// AUDIT_DEGRADED_MODE=rules_only 时跳过 LLM/RAG（额度耗尽 / 演示兜底）。

const NOOP_LLM: LLMProvider = {
  name: "degraded-noop",
  async generate(): Promise<string> {
    throw new Error("degraded mode: LLM must not be called");
  },
};

export async function executeAuditJob(jobId: string): Promise<void> {
  await workerUpdateJobStatus(jobId, "running");

  try {
    const job = await workerGetJob(jobId);
    if (!job) throw new Error(`任务 ${jobId} 不存在`);
    if (!job.storage_path) throw new Error("任务缺少上传文件（storage_path 为空）");

    const buffer = await workerDownloadFile(job.storage_path);
    const transactions = parseAuditFile(buffer, job.filename);
    await workerSaveRawData({ jobId, data: transactions });

    const degraded = isAuditDegradedMode();
    if (degraded) {
      console.info(`[executeAuditJob] job=${jobId} mode=rules_only (LLM skipped)`);
    }

    const graph = buildAuditGraph(
      degraded
        ? {
            llm: NOOP_LLM,
            retrieve: async () => [],
            degraded: true,
          }
        : { llm: getLLM(), retrieve },
    );
    const result = await graph.invoke({ jobId, input: { transactions } });

    if (!result.report) {
      throw new Error("工作流结束但未产出 AuditReport");
    }

    await workerSaveReport({ jobId, report: result.report });
    await workerUpdateJobStatus(jobId, "done");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // 状态落库不能让原始错误丢失；落库失败时仅记录。
    await workerUpdateJobStatus(jobId, "failed", message).catch((e) =>
      console.error("[executeAuditJob] 写入 failed 状态失败:", e),
    );
    throw err;
  }
}
