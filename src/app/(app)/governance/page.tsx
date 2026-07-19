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
            治理与合规
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          系统能力边界、禁止用途与当前运行参数。
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">系统能力</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>费用/报销循环交易的确定性规则初筛（可复现）</li>
          <li>可解释发现（规则 / 证据 / 准则 / 解释 / 建议程序）</li>
          <li>底稿起草辅助（完整模式使用大模型；降级模式使用结构化模板）</li>
          <li>人工复核状态与审计轨迹记录</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">禁止用途</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>不得直接作为审计意见或监管报送结论</li>
          <li>不得在无人工复核的情况下对外披露发现事项</li>
          <li>不得由大模型新增无证据支撑的风险结论</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">已知局限</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>当前规则覆盖费用循环常见红旗，非全科目审计方法</li>
          <li>重要性参数为项目级配置，需按业务调整</li>
          <li>知识库语料需持续治理与授权更新</li>
          <li>长任务受部署平台时长限制；可启用规则-only 降级模式</li>
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

      <section className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <p className="font-medium">人工复核要求</p>
        <p className="mt-1 text-muted-foreground">
          High
          风险默认「待复核」。项目组须在任务详情中清除或标记例外后，方可视为完成复核链。无大模型可用时，可设置
          AUDIT_DEGRADED_MODE=rules_only，仅运行规则引擎与结构化底稿。
        </p>
      </section>
    </div>
  );
}
