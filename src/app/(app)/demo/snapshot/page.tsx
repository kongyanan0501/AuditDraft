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
          返回质量评测
        </Link>
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          暂无预计算结果，请联系管理员生成标准数据集预跑结果。
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
          返回质量评测
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            预计算结果
          </h1>
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            只读参考
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          基于标准数据集的规则引擎预跑结果，供查阅参考；与当前任务实时跑批相互独立。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          数据集 {snap.dataset} · 生成于{" "}
          {new Date(snap.generatedAt).toLocaleString("zh-CN", {
            hour12: false,
          })}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium">审计工作流</h2>
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
        <h2 className="mb-3 text-sm font-medium">审计底稿</h2>
        <ReportViewer workpaper={snap.report.workpaper} />
      </section>
    </div>
  );
}
