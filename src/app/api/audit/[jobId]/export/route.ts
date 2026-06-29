import { NextResponse } from "next/server";

import { exportReport, type ExportFormat } from "@/lib/export";
import { getReportByJobId, requireUser } from "@/lib/supabase/repository";

// GET /api/audit/[jobId]/export?format=word|pdf
// 鉴权 + RLS 校验归属，导出审计报告为 Word / PDF 下载。

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } },
): Promise<Response> {
  try {
    await requireUser();

    const format: ExportFormat =
      new URL(request.url).searchParams.get("format") === "pdf"
        ? "pdf"
        : "word";

    const row = await getReportByJobId(params.jobId);
    if (!row) {
      return NextResponse.json(
        { error: "报告不存在或无访问权限" },
        { status: 404 },
      );
    }

    const file = await exportReport(row.report_json, format);
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "导出失败";
    const status = message.includes("未登录") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
