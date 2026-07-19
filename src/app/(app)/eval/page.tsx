import { BadgeCheck, Camera, FlaskConical, Scale } from "lucide-react";
import Link from "next/link";

import {
  loadHumanBaseline,
  loadLatestEval,
} from "@/lib/eval/loadResults";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default function EvalPage() {
  const evalResult = loadLatestEval();
  const human = loadHumanBaseline();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">质量评测</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          规则引擎离线回归指标与人工基线对比。系统输出为辅助草稿，须经项目组复核后方可归档，不构成审计意见。
        </p>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-start gap-2 text-sm">
          <Camera className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">预计算结果</p>
            <p className="text-xs text-muted-foreground">
              查看基于标准数据集的规则引擎预跑结果（只读参考）。
            </p>
          </div>
        </div>
        <Link
          href="/demo/snapshot"
          className="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          查看预计算结果
        </Link>
      </section>

      {!evalResult ? (
        <section className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          尚未找到 <code className="text-xs">evals/out/latest.json</code>。
          请先在仓库根目录执行{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
            npm run eval:golden
          </code>
          。
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Golden Set 指标</h2>
            <span
              className={
                evalResult.thresholdsMet
                  ? "rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600"
              }
            >
              {evalResult.thresholdsMet ? "阈值达标" : "未达标"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Recall 召回"
              value={pct(evalResult.metrics.recall)}
              hint={`目标 ≥ ${pct(evalResult.thresholds.recallMin)}`}
            />
            <MetricCard
              label="Precision 精确率"
              value={pct(evalResult.metrics.precision)}
              hint={`目标 ≥ ${pct(evalResult.thresholds.precisionMin)}`}
            />
            <MetricCard
              label="F1"
              value={evalResult.metrics.f1.toFixed(3)}
            />
            <MetricCard
              label="样本数"
              value={String(evalResult.metrics.caseCount)}
              hint={`${evalResult.metrics.tp} TP / ${evalResult.metrics.fp} FP / ${evalResult.metrics.fn} FN`}
            />
          </div>

          <dl className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-muted-foreground">数据集</dt>
              <dd className="font-medium">{evalResult.dataset}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-muted-foreground">规则集版本</dt>
              <dd className="font-medium">{evalResult.rulesetVersion}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-muted-foreground">评测时间</dt>
              <dd className="font-medium">
                {new Date(evalResult.ranAt).toLocaleString("zh-CN", {
                  hour12: false,
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-muted-foreground">可解释性</dt>
              <dd className="flex items-center gap-1 font-medium">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                {evalResult.metrics.explainabilityPass
                  ? "全部 finding 含四要素"
                  : `${evalResult.metrics.explainabilityFailures} 条缺失`}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:col-span-2 sm:block">
              <dt className="text-muted-foreground">运行方式</dt>
              <dd className="font-medium">
                离线 · 仅规则引擎 · 无 LLM / 无网络
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">人工 vs 系统</h2>
        </div>

        {!human ? (
          <p className="text-sm text-muted-foreground">
            缺少 <code className="text-xs">evals/human-baseline.json</code>
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">维度</th>
                    <th className="px-4 py-2.5 font-medium">人工筛查</th>
                    <th className="px-4 py-2.5 font-medium">AuditDraft 规则引擎</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">耗时</td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {human.analystMinutes} 分钟
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      ≈ {human.systemSecondsEstimate} 秒
                      {evalResult
                        ? `（召回 ${pct(evalResult.metrics.recall)}）`
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      正例命中
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {human.hits} / {human.plantedPositiveCount}
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {evalResult
                        ? `${evalResult.metrics.tp} / ${evalResult.metrics.tp + evalResult.metrics.fn}`
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">漏报</td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {human.misses}
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {evalResult ? evalResult.metrics.fn : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      误报（标注负例）
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {human.falsePositives}
                    </td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">
                      {evalResult ? evalResult.metrics.fp : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {human.label} · {human.datasetId}
              {human.method ? ` · ${human.method}` : ""}
              {human.notes ? ` · ${human.notes}` : ""}
            </p>
          </>
        )}
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="text-sm font-medium">方法说明</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            风险硬结论由确定性规则产出，同输入同输出，支持离线回归。
          </li>
          <li>
            Golden Set 包含正例与负例；Precision / Recall 见上方指标。
          </li>
          <li>
            大模型仅用于计划与底稿成文，受「无证据无结论」约束；必要时可启用规则-only
            降级模式。
          </li>
        </ul>
      </section>
    </div>
  );
}
