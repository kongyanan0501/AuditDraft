import { ArrowLeftRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ContrastPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            对照墙 · 纯 LLM vs AuditDraft
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          30
          秒讲清差异：通用对话模型可以「看起来很懂审计」，但缺少可复现硬结论与证据链；AuditDraft
          用规则定责、四要素可复核。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-risk-high/30 bg-card p-5">
          <h2 className="text-sm font-semibold text-risk-high">
            纯 LLM 扫表（反面示例）
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            示意：把整表贴进聊天窗口后的典型风险
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              「供应商 Office Co
              存在舞弊嫌疑」——无触发规则、无行级证据、不可复现。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              「建议出具保留意见」——越权生成审计意见，违反质量边界。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              同问再问，结论漂移；无 Golden Set、无阈值可调。
            </li>
          </ul>
          <p className="mt-4 text-xs font-medium text-risk-high">
            评委一句话：黑盒、不可审计、不可治理。
          </p>
        </section>

        <section className="rounded-lg border border-emerald-500/30 bg-card p-5">
          <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            AuditDraft 混合推理
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            同一费用循环数据上的系统行为
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              硬结论仅来自规则：`duplicate_payment` / `missing_approval` /
              …
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              每条 finding：触发规则 + 证据 + 准则 + 解释 + 建议程序。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              离线 Golden Set 可回归；可降级、可复核、可调阈值。
            </li>
          </ul>
          <p className="mt-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            评委一句话：协审初筛 + 可进 Prepare→Review。
          </p>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">路演话术（收束）</p>
        <p className="mt-1">
          「我们不是用大模型替代审计师判断，而是把可复现的劳动交给规则，把表达交给模型，把签字留给人。」
        </p>
      </section>
    </div>
  );
}
