"use server";

import { revalidatePath } from "next/cache";

import { updateFindingReviewStatus } from "@/lib/supabase/repository";
import type { ReviewerStatus } from "@/types/audit";

export async function setFindingReviewStatus(input: {
  jobId: string;
  findingId: string;
  status: ReviewerStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await updateFindingReviewStatus(input);
    revalidatePath(`/jobs/${input.jobId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
