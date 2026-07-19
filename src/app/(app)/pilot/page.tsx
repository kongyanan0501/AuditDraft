import { Map } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PilotPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            试点方案 · 对内一页纸
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          面向安永华明内部评审的落地路径设想（演示用，非正式承诺）。
        </p>
      </div>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">1. 试点范围</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>业务：费用 / 报销循环初筛 + 草稿底稿</li>
          <li>用户：1～2 个项目组（Prepare + Reviewer）</li>
          <li>数据：脱敏历史明细或合成集；生产前完成分级评估</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">2. 成功指标（8～12 周）</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>初筛耗时下降（对比人工基线，见 Eval 页）</li>
          <li>埋雷召回 ≥ 95%（Golden Set 离线门禁）</li>
          <li>High 风险 100% 经人工复核状态闭环</li>
          <li>零「无证据结论」进入归档包</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">3. 风险与控制</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>模型幻觉 → 规则硬结论 + EXPLAINABILITY_GUARD + 降级模式</li>
          <li>数据安全 → RLS、最小权限、演示脱敏、轨迹可审计</li>
          <li>质量风险 → 明确 draft 边界，禁止直接出意见</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">4. 推广路径</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>试点项目组验证指标</li>
          <li>质量 / 风险复核工具认证</li>
          <li>规则包扩展到 AP / Payroll 等循环</li>
          <li>与现有工作底稿库 / 档案流程对接</li>
        </ol>
      </section>

      <p className="text-xs text-muted-foreground">
        相关页面：
        <Link href="/eval" className="underline">
          Eval
        </Link>
        {" · "}
        <Link href="/governance" className="underline">
          治理
        </Link>
        {" · "}
        <Link href="/contrast" className="underline">
          对照墙
        </Link>
      </p>
    </div>
  );
}
