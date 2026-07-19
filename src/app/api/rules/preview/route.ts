import { NextResponse } from "next/server";

import { enrichFindings } from "@/lib/audit/finalizeReport";
import { parseAuditFile } from "@/lib/parse";
import {
  mergeRuleConfig,
  runRules,
  type RuleConfig,
} from "@/lib/rules";
import { requireUser } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

/** POST JSON: { config?, useDemo?: true } or multipart file + config fields. */
export async function POST(request: Request): Promise<Response> {
  try {
    await requireUser();

    const contentType = request.headers.get("content-type") ?? "";
    let configPartial: Partial<RuleConfig> = {};
    let buffer: Buffer | null = null;
    let filename = "preview.csv";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
        filename = file.name;
      }
      configPartial = {
        approvalThreshold: num(form.get("approvalThreshold")),
        splitNearRatio: num(form.get("splitNearRatio")),
        zScoreThreshold: num(form.get("zScoreThreshold")),
      };
    } else {
      const body = (await request.json()) as {
        config?: Partial<RuleConfig>;
        useDemo?: boolean;
      };
      configPartial = body.config ?? {};
    }

    if (!buffer) {
      const { readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      buffer = readFileSync(
        join(process.cwd(), "samples", "expense_transactions.csv"),
      );
      filename = "expense_transactions.csv";
    }

    const config = mergeRuleConfig(
      Object.fromEntries(
        Object.entries(configPartial).filter(([, v]) => v != null && !Number.isNaN(v)),
      ) as Partial<RuleConfig>,
    );
    const transactions = parseAuditFile(buffer, filename);
    const findings = enrichFindings(runRules(transactions, undefined, config));

    return NextResponse.json({
      filename,
      config,
      transactionCount: transactions.length,
      findingCount: findings.length,
      findings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "preview failed";
    const status = message.includes("未登录") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function num(v: FormDataEntryValue | null | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
