import type { JobStatus } from "@/types/audit";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<JobStatus, string> = {
  pending: "border-border bg-secondary text-secondary-foreground",
  running: "border-risk-medium/30 bg-risk-medium/10 text-risk-medium",
  done: "border-risk-low/30 bg-risk-low/10 text-risk-low",
  failed: "border-risk-high/30 bg-risk-high/10 text-risk-high",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "待运行",
  running: "进行中",
  done: "已完成",
  failed: "失败",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
