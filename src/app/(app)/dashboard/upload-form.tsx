"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  triggerAudit,
  useRefreshPolling,
} from "@/components/audit/run-audit-button";

import { uploadAndCreateJob, type UploadResult } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "上传中…" : "上传"}
    </button>
  );
}

export function UploadForm() {
  const [state, formAction] = useFormState<UploadResult | null, FormData>(
    uploadAndCreateJob,
    null,
  );
  const startPolling = useRefreshPolling();
  const triggeredFor = useRef<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  // 上传成功后自动触发审计工作流（每个 jobId 只触发一次）。
  useEffect(() => {
    if (state?.ok !== true) return;
    if (triggeredFor.current === state.jobId) return;
    triggeredFor.current = state.jobId;
    setTriggerError(null);
    triggerAudit(state.jobId)
      .then(() => startPolling())
      .catch((err) =>
        setTriggerError(err instanceof Error ? err.message : "触发审计失败"),
      );
  }, [state, startPolling]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          accept=".csv,.xls,.xlsx"
          required
          className="block w-full text-sm text-muted-foreground file:mr-3 file:h-10 file:rounded-md file:border file:border-input file:bg-secondary file:px-4 file:text-sm file:font-medium file:text-secondary-foreground"
        />
        <SubmitButton />
      </div>
      {state?.ok === false ? (
        <p className="text-sm text-[#ef4444]">{state.error}</p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-[#22c55e]">
          上传成功，已创建任务 {state.jobId.slice(0, 8)}…，正在自动运行审计。
        </p>
      ) : null}
      {triggerError ? (
        <p className="text-sm text-[#ef4444]">{triggerError}</p>
      ) : null}
    </form>
  );
}
