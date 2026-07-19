"use client";

import { useState, useTransition } from "react";

import { ReportViewer } from "@/components/audit/report-viewer";
import { RiskCards } from "@/components/audit/risk-card";
import type { AuditReport } from "@/types/audit";

type ChallengeResponse = {
  elapsedMs: number;
  transactionCount: number;
  report: AuditReport;
  error?: string;
};

export default function ChallengePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ChallengeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!file) {
      setError("请先选择文件");
      return;
    }
    setError(null);
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/challenge", { method: "POST", body });
      const data = (await res.json()) as ChallengeResponse;
      if (!res.ok) {
        setError(data.error ?? "挑战失败");
        return;
      }
      setResult(data);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          评委挑战模式
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          上传评委自带 CSV/Excel，规则引擎同步初筛（不调用 LLM、不建任务）。目标：现场约
          60 秒内给出可解释 findings。
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:text-xs"
        />
        <button
          type="button"
          disabled={pending}
          onClick={run}
          className="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "分析中…" : "开始挑战"}
        </button>
      </section>

      {error ? <p className="text-sm text-risk-high">{error}</p> : null}

      {result ? (
        <section className="space-y-6">
          <p className="text-sm text-muted-foreground">
            交易 {result.transactionCount} · 耗时{" "}
            <span className="font-medium text-foreground">
              {result.elapsedMs} ms
            </span>{" "}
            · 风险等级 {result.report.riskLevel.toUpperCase()} · findings{" "}
            {result.report.findings.length}
          </p>
          <RiskCards findings={result.report.findings} />
          <div>
            <h2 className="mb-2 text-sm font-medium">结果说明</h2>
            <ReportViewer workpaper={result.report.workpaper} />
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          也可先用仓库内{" "}
          <code className="text-xs">samples/ey_expense_demo_3k.csv</code>{" "}
          自测。
        </p>
      )}
    </div>
  );
}
