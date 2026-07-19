import { ChevronDown, ShieldCheck } from "lucide-react";

import type { AuditFinding } from "@/types/audit";
import { cn } from "@/lib/utils";

import { ReviewStatusControl } from "./review-status-control";
import { SEVERITY, riskTypeLabel } from "./severity";

const IMPACT_LABEL: Record<string, string> = {
  trivial: "明显微小",
  below_pm: "低于 PM",
  above_pm: "达到/超过 PM",
};

function RiskCard({
  finding,
  jobId,
}: {
  finding: AuditFinding;
  jobId?: string;
}) {
  const s = SEVERITY[finding.severity] ?? SEVERITY.low;

  return (
    <article
      className={cn("overflow-hidden rounded-lg border bg-card", s.border)}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={cn("mt-0.5 h-9 w-1 shrink-0 rounded-full", s.accent)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">
              {finding.findingId ? `${finding.findingId} · ` : ""}
              {riskTypeLabel(String(finding.riskType))}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                s.surface,
                s.text,
              )}
            >
              {s.label}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {finding.explanation}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {finding.materialityImpact ? (
              <span className="rounded-md bg-secondary px-1.5 py-0.5">
                重要性：{IMPACT_LABEL[finding.materialityImpact] ?? finding.materialityImpact}
              </span>
            ) : null}
            {finding.fraudRiskFlag ? (
              <span className="rounded-md bg-risk-high/10 px-1.5 py-0.5 text-risk-high">
                舞弊红旗
              </span>
            ) : null}
          </div>
          {jobId && finding.findingId ? (
            <div className="mt-3">
              <ReviewStatusControl
                jobId={jobId}
                findingId={finding.findingId}
                status={finding.reviewerStatus ?? "open"}
              />
            </div>
          ) : null}
        </div>
      </div>

      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary">
          可解释性 / 建议程序 / 证据
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="space-y-3 border-t border-border bg-secondary/40 px-4 py-3 text-xs">
          <div>
            <dt className="font-medium text-foreground">触发规则</dt>
            <dd className="mt-0.5 font-mono text-muted-foreground">
              {finding.triggeredRule}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">数据证据</dt>
            <dd className="mt-0.5">
              <pre className="overflow-x-auto rounded-md border border-border bg-card p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(finding.evidence, null, 2)}
              </pre>
            </dd>
          </div>
          {finding.standardRef ? (
            <div>
              <dt className="font-medium text-foreground">审计标准引用</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {finding.standardRef}
              </dd>
            </div>
          ) : null}
          {finding.recommendedProcedures?.length ? (
            <div>
              <dt className="font-medium text-foreground">建议进一步审计程序</dt>
              <dd className="mt-0.5">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {finding.recommendedProcedures.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
      </details>
    </article>
  );
}

export function RiskCards({
  findings,
  jobId,
}: {
  findings: AuditFinding[];
  jobId?: string;
}) {
  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center">
        <ShieldCheck className="h-6 w-6 text-risk-low" strokeWidth={1.5} />
        <p className="text-sm font-medium">未发现风险事项</p>
        <p className="text-xs text-muted-foreground">
          规则引擎未在该批数据中命中任何确定性风险。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {findings.map((finding, i) => (
        <RiskCard
          key={finding.findingId ?? `${finding.riskType}-${i}`}
          finding={finding}
          jobId={jobId}
        />
      ))}
    </div>
  );
}
