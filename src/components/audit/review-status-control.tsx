"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setFindingReviewStatus } from "@/app/(app)/jobs/[id]/review-actions";
import type { ReviewerStatus } from "@/types/audit";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ReviewerStatus; label: string }[] = [
  { value: "open", label: "待复核" },
  { value: "cleared", label: "已清除" },
  { value: "exception", label: "例外保留" },
];

export function ReviewStatusControl({
  jobId,
  findingId,
  status,
}: {
  jobId: string;
  findingId: string;
  status: ReviewerStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-foreground">
        复核状态
      </label>
      <select
        disabled={pending || !findingId}
        value={status}
        onChange={(e) => {
          const next = e.target.value as ReviewerStatus;
          setError(null);
          startTransition(async () => {
            const res = await setFindingReviewStatus({
              jobId,
              findingId,
              status: next,
            });
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
        className={cn(
          "h-8 rounded-md border border-input bg-card px-2 text-xs",
          pending && "opacity-60",
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-risk-high">{error}</p>
      ) : null}
    </div>
  );
}
