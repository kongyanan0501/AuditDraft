"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 任务进行中时轮询刷新 Server Component 数据，反映 running → done/failed 的状态变化。
 * （阶段3 工作流为后台异步执行；这里以轮询替代订阅，逻辑隔离在客户端叶子组件。）
 */
export function StatusPoller({
  active,
  intervalMs = 3000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
