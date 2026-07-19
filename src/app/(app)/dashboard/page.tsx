import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { RunAuditButton } from "@/components/audit/run-audit-button";
import { StatusBadge } from "@/components/audit/status-badge";
import { StatusPoller } from "@/components/audit/status-poller";
import { isAuditDegradedMode } from "@/lib/env";
import { getJobs } from "@/lib/supabase/repository";

import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

export default async function DashboardPage() {
  const jobs = await getJobs();
  const hasRunning = jobs.some((j) => j.status === "running");

  return (
    <div className="space-y-8">
      <StatusPoller active={hasRunning} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight">审计任务</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传财务数据，自动运行审计工作流并生成可解释底稿。
        </p>
        {isAuditDegradedMode() ? (
          <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            当前为<strong className="font-medium">规则-only 降级模式</strong>
            （AUDIT_DEGRADED_MODE=rules_only）：跳过 LLM/RAG，仍可产出可解释风险与模板底稿。
          </p>
        ) : null}
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-medium">上传审计数据</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          支持 CSV / Excel。演示推荐{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">
            samples/ey_expense_demo_3k.csv
          </code>
          （约 3000 行，含埋雷风险）。上传后将自动创建任务并运行审计。
        </p>
        <UploadForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">
          任务列表{" "}
          <span className="text-muted-foreground">({jobs.length})</span>
        </h2>
        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            还没有任务，上传一个文件开始。
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <span className="truncate">{job.filename}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.created_at)}
                  </p>
                  {job.status === "failed" && job.error ? (
                    <p className="mt-1 line-clamp-2 text-xs text-risk-high">
                      {job.error}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {job.status === "pending" || job.status === "failed" ? (
                    <RunAuditButton
                      jobId={job.id}
                      label={job.status === "failed" ? "重试" : "运行审计"}
                    />
                  ) : null}
                  <StatusBadge status={job.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
