import { ArrowLeftRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ContrastPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            方法对比
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          通用大模型对话与本系统在审计场景下的能力边界差异。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">通用 LLM 直接分析</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            将明细粘贴至对话模型时的常见局限
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              可能输出无触发规则、无行级证据的风险判断，难以复核。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              可能越权生成审计意见类表述，超出辅助分析边界。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              同一输入多次询问结论可能漂移；缺少固定阈值与回归基线。
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">AuditDraft 混合推理</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            规则引擎 + 可选生成式成文
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              风险硬结论由确定性规则产出，同输入同输出。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              每条发现包含触发规则、数据证据、准则引用、解释与建议程序。
            </li>
            <li className="rounded-md border border-border bg-secondary/40 p-3">
              支持离线评测回归、规则阈值配置、人工复核与降级运行。
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        本系统定位为项目组协审工具：规则承担可复现检测，模型辅助表达，专业判断与签字由人完成。
      </section>
    </div>
  );
}
