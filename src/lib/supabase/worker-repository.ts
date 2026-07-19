import "server-only";

import type { AuditReport, JobStatus } from "@/types/audit";

import { createAdminClient } from "./admin";
import { AUDIT_UPLOADS_BUCKET, type AuditJobRow } from "./types";

/**
 * 后台工作流数据访问层（service role / 绕过 RLS）。
 *
 * 与 repository.ts（请求作用域、RLS、依赖 cookies）区分：审计工作流是 detached 的
 * 后台执行，脱离请求上下文后 cookies() 不可用，故统一用 admin 客户端。
 * 调用前提：上游已在请求作用域用 RLS 客户端校验过任务归属（见 /api/audit）。
 */

class WorkerRepositoryError extends Error {
  constructor(operation: string, cause: string) {
    super(`[worker-repository] ${operation} 失败：${cause}`);
    this.name = "WorkerRepositoryError";
  }
}

export async function workerGetJob(jobId: string): Promise<AuditJobRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audit_jobs")
    .select()
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new WorkerRepositoryError("workerGetJob", error.message);
  return data;
}

/** 更新状态；失败时写入 error，其它状态清空 error。 */
export async function workerUpdateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from("audit_jobs")
    .update({ status, error: status === "failed" ? (error ?? null) : null })
    .eq("id", jobId);
  if (dbError) {
    throw new WorkerRepositoryError("workerUpdateJobStatus", dbError.message);
  }
}

export async function workerSaveReport(input: {
  jobId: string;
  report: AuditReport;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_reports").insert({
    job_id: input.jobId,
    report_json: input.report,
    risk_level: input.report.riskLevel,
  });
  if (error) {
    const hint =
      /job_id/i.test(error.message) && /schema|does not exist|42703/i.test(error.message)
        ? " — 线上 audit_reports 仍是旧结构(task_id/content)。请在 Supabase SQL Editor 执行 supabase/migrations/0004_fix_audit_reports_schema.sql 后重试。"
        : "";
    throw new WorkerRepositoryError("workerSaveReport", error.message + hint);
  }
}

export async function workerSaveRawData(input: {
  jobId: string;
  data: unknown;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("audit_raw_data")
    .insert({ job_id: input.jobId, data: input.data });
  if (error) {
    throw new WorkerRepositoryError("workerSaveRawData", error.message);
  }
}

/** 从私有 bucket 下载文件为 Buffer。 */
export async function workerDownloadFile(storagePath: string): Promise<Buffer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(AUDIT_UPLOADS_BUCKET)
    .download(storagePath);
  if (error || !data) {
    throw new WorkerRepositoryError(
      "workerDownloadFile",
      error?.message ?? "无文件数据",
    );
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
