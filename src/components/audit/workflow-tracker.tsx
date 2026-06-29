import { Check, CircleSlash, Loader } from "lucide-react";

import type { JobStatus } from "@/types/audit";
import { cn } from "@/lib/utils";

// LangGraph 7 节点流程可视化。后台未做逐节点上报，故按整体 job 状态推导：
// pending=待运行 / running=进行中（动效）/ done=全部完成 / failed=流程中断。

const NODES: { key: string; label: string; hint: string }[] = [
  { key: "parseData", label: "解析数据", hint: "Excel/CSV → 交易" },
  { key: "auditPlanner", label: "审计计划", hint: "LLM + RAG" },
  { key: "ruleEngine", label: "规则引擎", hint: "确定性检测" },
  { key: "anomalyDetection", label: "异常检测", hint: "离群分析" },
  { key: "riskAssessment", label: "风险评估", hint: "评级 + 建议" },
  { key: "workpaperGeneration", label: "底稿生成", hint: "LLM 撰写" },
  { key: "reportExport", label: "报告导出", hint: "落库 + 文件" },
];

type NodeState = "idle" | "running" | "done" | "failed";

function nodeState(status: JobStatus): NodeState {
  if (status === "done") return "done";
  if (status === "running") return "running";
  if (status === "failed") return "failed";
  return "idle";
}

function StateIcon({ state }: { state: NodeState }) {
  if (state === "done") {
    return <Check className="h-4 w-4 text-risk-low" strokeWidth={2.5} />;
  }
  if (state === "running") {
    return (
      <Loader
        className="h-4 w-4 animate-spin text-risk-medium motion-reduce:animate-none"
        strokeWidth={2}
      />
    );
  }
  if (state === "failed") {
    return <CircleSlash className="h-4 w-4 text-risk-high" strokeWidth={2} />;
  }
  return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />;
}

export function WorkflowTracker({ status }: { status: JobStatus }) {
  const state = nodeState(status);

  return (
    <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {NODES.map((node, i) => (
        <li
          key={node.key}
          className={cn(
            "flex items-center gap-3 bg-card px-3 py-3",
            state === "running" && "animate-pulse motion-reduce:animate-none",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <StateIcon state={state} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="block truncate text-sm font-medium">
              {node.label}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {node.hint}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
