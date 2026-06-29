import { ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";

import { getJobs } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

export default async function ReportsPage() {
  const jobs = await getJobs();
  const completed = jobs.filter((j) => j.status === "done");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">审计报告</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          已完成的审计任务底稿，可查看风险事项与可解释依据，并导出 Word / PDF。
        </p>
      </div>

      {completed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center">
          <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">还没有已完成的报告。</p>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-foreground underline"
          >
            去上传数据并运行审计
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {completed.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="group flex items-center justify-between gap-4 px-4 py-3 hover:bg-secondary"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {job.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
