"use client";

import { useState, useTransition } from "react";

import { RiskCards } from "@/components/audit/risk-card";
import type { AuditFinding } from "@/types/audit";

type ReconcileResponse = {
  expenseCount: number;
  paymentCount: number;
  findingCount: number;
  findings: AuditFinding[];
  error?: string;
};

export default function ReconcilePage() {
  const [result, setResult] = useState<ReconcileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/reconcile/preview", { method: "POST" });
      const data = (await res.json()) as ReconcileResponse;
      if (!res.ok) {
        setError(data.error ?? "勾稽失败");
        return;
      }
      setResult(data);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          多源勾稽 · 报销 ↔ 付款
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          演示样本：
          <code className="text-xs">samples/ey_expense_side.csv</code> +{" "}
          <code className="text-xs">samples/ey_payment_side.csv</code>
          。匹配键优先发票号，其次供应商+金额。
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={run}
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "勾稽中…" : "运行演示勾稽"}
      </button>

      {error ? <p className="text-sm text-risk-high">{error}</p> : null}

      {result ? (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            报销 {result.expenseCount} · 付款 {result.paymentCount} · 例外{" "}
            {result.findingCount}
          </p>
          <p className="text-xs text-muted-foreground">
            预期可见：有报销无付款、金额不一致、有付款无报销。
          </p>
          <RiskCards findings={result.findings} />
        </section>
      ) : null}
    </div>
  );
}
