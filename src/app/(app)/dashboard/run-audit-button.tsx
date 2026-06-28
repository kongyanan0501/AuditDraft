"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** 触发某任务的审计工作流。失败抛出带可读消息的 Error。 */
export async function triggerAudit(jobId: string): Promise<void> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `触发失败 (${res.status})`);
  }
}

/**
 * 后台工作流为异步执行，这里用轻量轮询刷新 Server Component 数据以反映状态变化。
 * （阶段4 会用更完善的 Workflow Tracker 替代。）
 */
export function useRefreshPolling() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return useCallback(() => {
    router.refresh();
    if (timer.current) clearInterval(timer.current);
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks += 1;
      router.refresh();
      if (ticks >= 15 && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 3000);
  }, [router]);
}

export function RunAuditButton({
  jobId,
  label = "运行审计",
}: {
  jobId: string;
  label?: string;
}) {
  const startPolling = useRefreshPolling();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      await triggerAudit(jobId);
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "触发失败");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="h-8 shrink-0 rounded-md border border-input bg-card px-3 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {pending ? "触发中…" : label}
      </button>
      {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
    </div>
  );
}
