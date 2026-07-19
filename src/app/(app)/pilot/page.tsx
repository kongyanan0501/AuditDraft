import { Map } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PilotPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">实施方案</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          费用循环 AI 协审能力的落地范围、成功标准与推广路径。
        </p>
      </div>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">1. 适用范围</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>业务：费用 / 报销循环初筛与底稿起草辅助</li>
          <li>角色：执行人员（Prepare）与复核人员（Reviewer）</li>
          <li>数据：经分级评估后的脱敏或授权业务明细</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">2. 成功标准</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>初筛效率相对人工基线提升（见质量评测页对比）</li>
          <li>Golden Set 正例召回达到约定阈值（默认 ≥ 95%）</li>
          <li>High 风险事项均完成人工复核状态闭环</li>
          <li>归档材料中不出现无证据支撑的结论</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">3. 风险与控制</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>模型幻觉：硬结论仅来自规则；生成环节受可解释性约束</li>
          <li>数据安全：行级权限隔离、最小权限、全链路轨迹</li>
          <li>质量边界：输出为草稿底稿，不得直接作为审计意见</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">4. 推广路径</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>选定项目组验证成功标准</li>
          <li>通过质量与风险管理复核</li>
          <li>规则包扩展至应付、薪酬等相关循环</li>
          <li>对接既有工作底稿与档案流程</li>
        </ol>
      </section>

      <p className="text-xs text-muted-foreground">
        相关：
        <Link href="/eval" className="underline">
          质量评测
        </Link>
        {" · "}
        <Link href="/governance" className="underline">
          治理
        </Link>
      </p>
    </div>
  );
}
