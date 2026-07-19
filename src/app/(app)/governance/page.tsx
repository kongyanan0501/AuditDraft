import { Shield } from "lucide-react";

import { RULESET_VERSION } from "@/lib/audit/materiality";
import { getMaterialityConfig } from "@/lib/audit/materiality";

export const dynamic = "force-dynamic";

export default function GovernancePage() {
  const mat = getMaterialityConfig();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            Responsible AI · 系统卡
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          面向安永质量与风险偏好的能力边界说明。演示数据为脱敏合成，不含真实客户机密。
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">系统做什么</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>费用/报销循环交易的确定性规则初筛（可复现）</li>
          <li>可解释 findings（规则 / 证据 / 准则 / 解释 / 建议程序）</li>
          <li>草稿底稿生成（完整模式 LLM；降级模式模板）</li>
          <li>人工复核状态与审计轨迹记录</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">禁止用途</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>不得直接作为审计意见或监管报送结论</li>
          <li>不得在无人工复核的情况下对外披露 findings</li>
          <li>不得用 LLM 新增无证据的风险结论（系统硬约束）</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">已知局限</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>当前规则覆盖费用循环常见红旗，非全科目审计方法</li>
          <li>重要性参数为项目级配置，需按业务调整</li>
          <li>RAG 知识库为演示种子语料，生产需合规语料治理</li>
          <li>Serverless 长任务受平台时长限制；可用降级模式兜底</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">当前版本元数据</h2>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">规则集</dt>
            <dd className="font-medium">{RULESET_VERSION}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">规划重要性</dt>
            <dd className="font-medium tabular-nums">
              {mat.planningMateriality.toLocaleString("zh-CN")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">实际执行重要性</dt>
            <dd className="font-medium tabular-nums">
              {mat.performanceMateriality.toLocaleString("zh-CN")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">明显微小临界值</dt>
            <dd className="font-medium tabular-nums">
              {mat.trivialThreshold.toLocaleString("zh-CN")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
        <p className="font-medium">Human-in-the-loop</p>
        <p className="mt-1 text-muted-foreground">
          High
          风险默认「待复核」。项目组须在任务详情中清除或标记例外，方可视为完成复核链。Kill
          switch：设置 AUDIT_DEGRADED_MODE=rules_only 可在无 LLM 时继续产出可解释发现。
        </p>
      </section>
    </div>
  );
}
