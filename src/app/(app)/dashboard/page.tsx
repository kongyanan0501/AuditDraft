import { signOut } from "@/app/(auth)/actions";
import { getJobs, requireUser } from "@/lib/supabase/repository";
import type { JobStatus } from "@/types/audit";

import { RunAuditButton } from "./run-audit-button";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<JobStatus, string> = {
  pending: "border-border bg-secondary text-secondary-foreground",
  running: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]",
  done: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]",
  failed: "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

export default async function DashboardPage() {
  const [user, jobs] = await Promise.all([requireUser(), getJobs()]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">审计工作台</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            登出
          </button>
        </form>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-1 text-base font-medium">上传审计数据</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          支持 CSV / Excel，上传后会创建一条待处理审计任务。
        </p>
        <UploadForm />
      </section>

      <section>
        <h2 className="mb-4 text-base font-medium">
          我的任务 <span className="text-muted-foreground">({jobs.length})</span>
        </h2>
        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            还没有任务，上传一个文件试试。
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{job.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.created_at)}
                  </p>
                  {job.status === "failed" && job.error ? (
                    <p className="mt-1 text-xs text-[#ef4444]">{job.error}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {job.status === "pending" || job.status === "failed" ? (
                    <RunAuditButton
                      jobId={job.id}
                      label={job.status === "failed" ? "重试" : "运行审计"}
                    />
                  ) : null}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[job.status]}`}
                  >
                    {job.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
