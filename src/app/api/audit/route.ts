import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

import { executeAuditJob } from "@/lib/graph/run";
import { getJob, requireUser } from "@/lib/supabase/repository";

// POST /api/audit —— 触发某个任务的审计工作流（鉴权 + 异步执行）。
// body: { jobId: string }
// 同步阶段：校验登录与任务归属（RLS）；随后异步执行工作流，立即返回 202。
// 工作流内部维护任务状态机（running → done/failed），前端通过轮询任务状态获知进展。
//
// 长任务保活：用 Vercel `waitUntil` 在响应返回后继续执行后台工作流——
// 否则 Serverless 函数会在响应后冻结并杀掉 detached promise（本地/长驻 Node 无此问题，
// waitUntil 在非 Vercel 环境亦可安全降级）。需配合 route 的 maxDuration（见下）。

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    await requireUser();

    const body = (await request.json().catch(() => null)) as {
      jobId?: unknown;
    } | null;
    const jobId = body?.jobId;
    if (typeof jobId !== "string" || jobId.length === 0) {
      return NextResponse.json({ error: "缺少 jobId" }, { status: 400 });
    }

    // RLS：非本人任务返回 null。
    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "任务不存在或无访问权限" },
        { status: 404 },
      );
    }
    if (job.status === "running") {
      return NextResponse.json({ error: "任务正在运行中" }, { status: 409 });
    }
    if (!job.storage_path) {
      return NextResponse.json(
        { error: "任务尚未上传文件" },
        { status: 400 },
      );
    }

    // 后台跑工作流（用 admin 客户端），不阻塞响应；waitUntil 保证函数在响应后不被立即回收。
    waitUntil(
      executeAuditJob(jobId).catch((err) => {
        console.error("[api/audit] 工作流执行失败:", err);
      }),
    );

    return NextResponse.json({ jobId, status: "running" }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "服务器错误";
    const status = message.includes("未登录") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
