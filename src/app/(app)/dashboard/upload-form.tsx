"use client";

import { useFormState, useFormStatus } from "react-dom";

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
          上传成功，已创建任务 {state.jobId.slice(0, 8)}…（status=pending）
        </p>
      ) : null}
    </form>
  );
}
