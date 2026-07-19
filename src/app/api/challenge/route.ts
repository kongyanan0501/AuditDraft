import { NextResponse } from "next/server";

import { finalizeReport } from "@/lib/audit/finalizeReport";
import { parseAuditFile } from "@/lib/parse";
import { runRules } from "@/lib/rules";
import { requireUser } from "@/lib/supabase/repository";
import type { AuditReport, RiskLevel } from "@/types/audit";

export const dynamic = "force-dynamic";

const RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** Sync rules-only challenge: upload CSV → findings in one response (no LLM). */
export async function POST(request: Request): Promise<Response> {
  const started = Date.now();
  try {
    await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传 CSV/Excel 文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const transactions = parseAuditFile(buffer, file.name);
    const findings = runRules(transactions);
    let riskLevel: RiskLevel = "low";
    for (const f of findings) {
      if (RANK[f.severity] > RANK[riskLevel]) riskLevel = f.severity;
    }

    const draft: AuditReport = {
      jobId: `challenge-${Date.now()}`,
      riskLevel,
      findings,
      workpaper: [
        "# 评委挑战模式结果（规则-only）",
        "",
        `文件：${file.name} · 交易 ${transactions.length} 笔 · 耗时 ${Date.now() - started}ms`,
        "",
        "> 本结果未调用 LLM，仅确定性规则。AI-assisted draft — subject to engagement review.",
        "",
      ].join("\n"),
      meta: { degraded: true, llmSkipped: true, mode: "rules_only" },
    };

    const report = finalizeReport(draft, {
      trailEvent: "challenge_mode",
      trailDetail: file.name,
    });

    return NextResponse.json({
      elapsedMs: Date.now() - started,
      transactionCount: transactions.length,
      report,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "challenge failed";
    const status = message.includes("未登录") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
