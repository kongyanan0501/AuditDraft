import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExportButtons } from "@/components/audit/export-buttons";
import { ReportViewer } from "@/components/audit/report-viewer";
import { RiskCards } from "@/components/audit/risk-card";
import { RunAuditButton } from "@/components/audit/run-audit-button";
import { StatusBadge } from "@/components/audit/status-badge";
import { StatusPoller } from "@/components/audit/status-poller";
import { WorkflowTracker } from "@/components/audit/workflow-tracker";
import { SEVERITY } from "@/components/audit/severity";
import { enrichFindings } from "@/lib/audit/finalizeReport";
import { getMaterialityConfig } from "@/lib/audit/materiality";
import { getJob, getReportByJobId } from "@/lib/supabase/repository";
import type { RiskLevel } from "@/types/audit";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN");
}

const RISK_ORDER: RiskLevel[] = ["high", "medium", "low"];

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [job, report] = await Promise.all([
    getJob(params.id),
    getReportByJobId(params.id),
  ]);

  if (!job) notFound();

  const active = job.status === "running" || job.status === "pending";
  const rawFindings = report?.report_json.findings ?? [];
  const findings = enrichFindings(rawFindings);
  const counts = RISK_ORDER.map((level) => ({
    level,
    n: findings.filter((f) => f.severity === level).length,
  }));
  const mat =
    report?.report_json.meta?.materiality ?? getMaterialityConfig();
  const openHigh = findings.filter(
    (f) => f.severity === "high" && (f.reviewerStatus ?? "open") === "open",
  ).length;
  const trail = report?.report_json.meta?.trail ?? [];

  return (
    <div className="space-y-8">
      <StatusPoller active={active} />

      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          返回任务
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {job.filename}
            </h1>
            <p className="text-xs text-muted-foreground">
              创建于 {formatDate(job.created_at)}
              {report?.report_json.meta?.rulesetVersion
                ? ` · ${report.report_json.meta.rulesetVersion}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {job.status === "done" && report ? (
              <ExportButtons jobId={job.id} />
            ) : null}
            {job.status === "pending" || job.status === "failed" ? (
              <RunAuditButton
                jobId={job.id}
                label={job.status === "failed" ? "重试" : "运行审计"}
              />
            ) : null}
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {report?.report_json.meta?.degraded ? (
            <p className="inline-flex rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
              降级模式（仅规则引擎 · 未调用 LLM）
            </p>
          ) : null}
          <p className="inline-flex rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
            AI-assisted draft · 须项目组复核
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium">审计工作流</h2>
        <WorkflowTracker status={job.status} />
      </section>

      {job.status === "failed" && job.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-risk-high/30 bg-risk-high/10 px-4 py-3">
          <CircleAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-risk-high"
            strokeWidth={2}
          />
          <div className="text-sm text-risk-high">
            <p className="font-medium">审计失败</p>
            <p className="mt-0.5 text-xs leading-relaxed">{job.error}</p>
          </div>
        </div>
      ) : null}

      {active ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {job.status === "running"
            ? "审计进行中，结果将自动刷新…"
            : "任务待运行，点击「运行审计」开始。"}
        </p>
      ) : null}

      {job.status === "done" && report ? (
        <>
          <section className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="text-sm font-medium">重要性参数</h2>
            <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">规划重要性</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(mat.planningMateriality)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  实际执行重要性 (PM)
                </dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(mat.performanceMateriality)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  明显微小错报临界值
                </dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(mat.trivialThreshold)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              可通过环境变量 MATERIALITY_PLANNING / MATERIALITY_PERFORMANCE /
              MATERIALITY_TRIVIAL 调整（重启生效）。
            </p>
          </section>

          {openHigh > 0 ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium">人工复核门闩</p>
              <p className="mt-1 text-xs leading-relaxed">
                仍有 {openHigh}{" "}
                条 high 风险处于「待复核」。建议清除或标记例外后方可视为完成
                Prepare→Review。
              </p>
            </div>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">
                风险事项{" "}
                <span className="text-muted-foreground">
                  ({findings.length})
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs">
                {counts.map(({ level, n }) => (
                  <span key={level} className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${SEVERITY[level].accent}`}
                    />
                    {SEVERITY[level].label} {n}
                  </span>
                ))}
              </div>
            </div>
            <RiskCards findings={findings} jobId={job.id} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium">审计底稿</h2>
            <ReportViewer workpaper={report.report_json.workpaper} />
          </section>

          {trail.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-medium">审计轨迹（摘要）</h2>
              <ul className="space-y-1 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                {trail.slice(-8).map((t) => (
                  <li key={`${t.at}-${t.event}`}>
                    <span className="font-mono text-[11px]">
                      {formatDate(t.at)}
                    </span>{" "}
                    · {t.event}
                    {t.detail ? ` — ${t.detail}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                完整治理说明见{" "}
                <Link href="/governance" className="underline">
                  Responsible AI / 系统卡
                </Link>
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
