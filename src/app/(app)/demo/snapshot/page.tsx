import { ArrowLeft, Camera } from "lucide-react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";

import { ReportViewer } from "@/components/audit/report-viewer";
import { RiskCards } from "@/components/audit/risk-card";
import { WorkflowTracker } from "@/components/audit/workflow-tracker";
import { SEVERITY } from "@/components/audit/severity";
import { enrichFindings } from "@/lib/audit/finalizeReport";
import type { DemoSnapshotFile } from "@/lib/eval/buildDemoSnapshot";
import type { RiskLevel } from "@/types/audit";

export const dynamic = "force-dynamic";

const RISK_ORDER: RiskLevel[] = ["high", "medium", "low"];

function loadSnapshot(): DemoSnapshotFile | null {
  try {
    const raw = readFileSync(
      join(process.cwd(), "samples", "demo-snapshots", "report_ey_demo.json"),
      "utf8",
    );
    return JSON.parse(raw) as DemoSnapshotFile;
  } catch {
    return null;
  }
}

export default function DemoSnapshotPage() {
  const snap = loadSnapshot();

  if (!snap) {
    return (
      <div className="space-y-4">
        <Link
          href="/eval"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回 Eval
        </Link>
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          缺少快照文件。请执行{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
            npm run generate:snapshot
          </code>
        </p>
      </div>
    );
  }

  const findings = enrichFindings(snap.report.findings);
  const counts = RISK_ORDER.map((level) => ({
    level,
    n: findings.filter((f) => f.severity === level).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/eval"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回 Eval
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            官方演示快照
          </h1>
          <span className="rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-300">
            Snapshot for failover
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {snap.disclaimer}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          数据集 {snap.dataset} · 生成于{" "}
          {new Date(snap.generatedAt).toLocaleString("zh-CN", {
            hour12: false,
          })}{" "}
          · {snap.label}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium">审计工作流（快照·已完成）</h2>
        <WorkflowTracker status="done" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">
            风险事项{" "}
            <span className="text-muted-foreground">({findings.length})</span>
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
        <RiskCards findings={findings} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">审计底稿（快照）</h2>
        <ReportViewer workpaper={snap.report.workpaper} />
      </section>
    </div>
  );
}
