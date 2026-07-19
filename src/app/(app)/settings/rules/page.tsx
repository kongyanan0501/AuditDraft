"use client";

import { useState, useTransition } from "react";

import { RiskCards } from "@/components/audit/risk-card";
import type { AuditFinding } from "@/types/audit";

type PreviewResponse = {
  config: {
    approvalThreshold: number;
    splitNearRatio: number;
    zScoreThreshold: number;
  };
  transactionCount: number;
  findingCount: number;
  findings: AuditFinding[];
  error?: string;
};

export default function RuleTuningPage() {
  const [approvalThreshold, setApprovalThreshold] = useState(10000);
  const [splitNearRatio, setSplitNearRatio] = useState(0.8);
  const [zScoreThreshold, setZScoreThreshold] = useState(2);
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runPreview() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/rules/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useDemo: true,
          config: { approvalThreshold, splitNearRatio, zScoreThreshold },
        }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setError(data.error ?? "预览失败");
        return;
      }
      setResult(data);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">规则调参台</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          阈值由项目组设定——专业判断仍在人。以下对内置小样{" "}
          <code className="text-xs">expense_transactions.csv</code>{" "}
          即时重跑规则（不调用 LLM）。
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">审批阈值</span>
          <input
            type="number"
            value={approvalThreshold}
            onChange={(e) => setApprovalThreshold(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">
            拆分贴边比例（相对阈值）
          </span>
          <input
            type="number"
            step="0.05"
            min={0.5}
            max={1}
            value={splitNearRatio}
            onChange={(e) => setSplitNearRatio(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">Z-score 阈值</span>
          <input
            type="number"
            step="0.1"
            value={zScoreThreshold}
            onChange={(e) => setZScoreThreshold(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <div className="sm:col-span-3">
          <button
            type="button"
            disabled={pending}
            onClick={runPreview}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "计算中…" : "预览 findings"}
          </button>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-risk-high">{error}</p>
      ) : null}

      {result ? (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            交易 {result.transactionCount} · findings {result.findingCount} ·
            当前阈值审批={result.config.approvalThreshold}
          </p>
          <RiskCards findings={result.findings} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          点击「预览 findings」查看调参效果。试着把审批阈值改为 25000，观察
          missing_approval 是否减少。
        </p>
      )}
    </div>
  );
}
