"use server";

import { revalidatePath } from "next/cache";

import {
  createJob,
  setJobStoragePath,
  uploadAuditFile,
} from "@/lib/supabase/repository";

const ACCEPTED_EXT = [".csv", ".xls", ".xlsx"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export type UploadResult = { ok: true; jobId: string } | { ok: false; error: string };

/**
 * 上传审计原始文件并登记任务：
 *   1) 校验文件类型/大小
 *   2) createJob(status='pending')
 *   3) 上传到私有 bucket（{user_id}/{job_id}/{filename}）
 *   4) 回填 storage_path
 * 注意：parseData / 触发工作流属于阶段3，这里只完成「上传 + 登记 pending 任务」。
 */
export async function uploadAndCreateJob(
  _prev: UploadResult | null,
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "请选择一个文件" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "文件过大（上限 10MB）" };
  }
  const lower = file.name.toLowerCase();
  if (!ACCEPTED_EXT.some((ext) => lower.endsWith(ext))) {
    return { ok: false, error: "仅支持 CSV / Excel 文件" };
  }

  try {
    const job = await createJob({ filename: file.name, status: "pending" });
    const path = await uploadAuditFile({ file, jobId: job.id });
    await setJobStoragePath(job.id, path);

    revalidatePath("/dashboard");
    return { ok: true, jobId: job.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "上传失败",
    };
  }
}
