import "server-only";

import { enrichFindings } from "@/lib/audit/finalizeReport";
import type {
  AuditReport,
  JobStatus,
  ReviewerStatus,
  RiskLevel,
} from "@/types/audit";
import { createClient } from "./server";
import {
  AUDIT_UPLOADS_BUCKET,
  type AuditJobRow,
  type AuditRawDataRow,
  type AuditReportRow,
} from "./types";

/**
 * 数据访问层（repository）。业务层只调用这些函数，不直接拼 SQL / 调 supabase-js。
 * 默认走 server.ts 的 RLS 客户端，所有读写都被 auth.uid() 约束在当前用户范围内。
 */

class RepositoryError extends Error {
  constructor(operation: string, cause: string) {
    super(`[repository] ${operation} 失败：${cause}`);
    this.name = "RepositoryError";
  }
}

/** 返回当前登录用户，未登录则抛错。 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new RepositoryError("requireUser", "未登录或 Session 失效");
  }
  return user;
}

/** 创建审计任务（默认 status='pending'）。 */
export async function createJob(input: {
  filename: string;
  storagePath?: string | null;
  status?: JobStatus;
}): Promise<AuditJobRow> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data, error } = await supabase
    .from("audit_jobs")
    .insert({
      user_id: user.id,
      filename: input.filename,
      storage_path: input.storagePath ?? null,
      status: input.status ?? "pending",
    })
    .select()
    .single();

  if (error || !data) {
    throw new RepositoryError("createJob", error?.message ?? "无返回数据");
  }
  return data;
}

/** 列出当前用户的全部任务（最新在前）。RLS 保证只返回本人数据。 */
export async function getJobs(): Promise<AuditJobRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_jobs")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    throw new RepositoryError("getJobs", error.message);
  }
  return data ?? [];
}

/** 读取单个任务（不存在或非本人 → null）。 */
export async function getJob(jobId: string): Promise<AuditJobRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_jobs")
    .select()
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new RepositoryError("getJob", error.message);
  }
  return data;
}

/** 更新任务状态（pending → running → done/failed）。 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("audit_jobs")
    .update({ status })
    .eq("id", jobId);

  if (error) {
    throw new RepositoryError("updateJobStatus", error.message);
  }
}

/** 回填任务的 Storage 对象路径（文件上传成功后调用）。 */
export async function setJobStoragePath(
  jobId: string,
  storagePath: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("audit_jobs")
    .update({ storage_path: storagePath })
    .eq("id", jobId);

  if (error) {
    throw new RepositoryError("setJobStoragePath", error.message);
  }
}

/** 读取某任务最新的审计报告（不存在或非本人 → null）。RLS 保证归属。 */
export async function getReportByJobId(
  jobId: string,
): Promise<AuditReportRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_reports")
    .select()
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new RepositoryError("getReportByJobId", error.message);
  }
  return data;
}

/** 落库审计报告（report_json = AuditReport 结构）。 */
export async function saveReport(input: {
  jobId: string;
  report: AuditReport;
  riskLevel?: RiskLevel;
}): Promise<AuditReportRow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_reports")
    .insert({
      job_id: input.jobId,
      report_json: input.report,
      risk_level: input.riskLevel ?? input.report.riskLevel,
    })
    .select()
    .single();

  if (error || !data) {
    throw new RepositoryError("saveReport", error?.message ?? "无返回数据");
  }
  return data;
}

/** Update one finding's reviewerStatus on the latest report for a job (RLS). */
export async function updateFindingReviewStatus(input: {
  jobId: string;
  findingId: string;
  status: ReviewerStatus;
}): Promise<AuditReport> {
  const row = await getReportByJobId(input.jobId);
  if (!row) throw new RepositoryError("updateFindingReviewStatus", "报告不存在");

  const report = row.report_json as AuditReport;
  const findings = enrichFindings(report.findings).map((f) =>
    f.findingId === input.findingId
      ? { ...f, reviewerStatus: input.status }
      : f,
  );
  const at = new Date().toISOString();
  const next: AuditReport = {
    ...report,
    findings,
    meta: {
      ...report.meta,
      trail: [
        ...(report.meta?.trail ?? []),
        {
          at,
          event: "review_status_updated",
          detail: `${input.findingId} → ${input.status}`,
        },
      ],
    },
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("audit_reports")
    .update({ report_json: next })
    .eq("id", row.id);

  if (error) {
    throw new RepositoryError("updateFindingReviewStatus", error.message);
  }
  return next;
}

/** 落库解析后的原始交易数据（parseData 产出）。 */
export async function saveRawData(input: {
  jobId: string;
  data: unknown;
}): Promise<AuditRawDataRow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_raw_data")
    .insert({ job_id: input.jobId, data: input.data })
    .select()
    .single();

  if (error || !data) {
    throw new RepositoryError("saveRawData", error?.message ?? "无返回数据");
  }
  return data;
}

/**
 * 上传审计原始文件到私有 bucket，返回对象路径。
 * 路径约定 {user_id}/{job_id}/{filename}，与 Storage RLS 策略一致。
 */
export async function uploadAuditFile(input: {
  file: File;
  jobId: string;
}): Promise<string> {
  const supabase = await createClient();
  const user = await requireUser();

  const safeName = input.file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${input.jobId}/${safeName}`;

  const { error } = await supabase.storage
    .from(AUDIT_UPLOADS_BUCKET)
    .upload(path, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new RepositoryError("uploadAuditFile", error.message);
  }
  return path;
}
