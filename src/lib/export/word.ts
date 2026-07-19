import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { proceduresForRisk } from "@/lib/audit/procedures";
import type { AuditFinding, AuditReport } from "@/types/audit";

// Word(.docx) 导出 — 演示级事务所底稿观感（档 A）：
// 封面签核栏 / W/P 索引表 / 已执行程序对照表 / 例外明细表 / 叙述正文 / 免责。
// 仅做序列化 / 排版，不做业务推理。

const PAGE_WIDTH_DXA = 9360; // ~6.5" content width

const RISK_LABEL: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const IMPACT_LABEL: Record<string, string> = {
  trivial: "明显微小",
  below_pm: "低于实际执行重要性",
  above_pm: "达到/超过实际执行重要性",
};

const THIN = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "999999",
};
const BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

/** Fixed procedure对照 rows for the expense-cycle rules pack. */
const EXECUTED_PROCEDURES: {
  id: string;
  objective: string;
  method: string;
  riskType: string;
}[] = [
  {
    id: "P-1",
    objective: "识别重复付款（同供应商+同金额+同发票）",
    method: "确定性规则 duplicate_payment",
    riskType: "duplicate_payment",
  },
  {
    id: "P-2",
    objective: "识别超阈值且无审批人的大额报销",
    method: "确定性规则 missing_approval",
    riskType: "missing_approval",
  },
  {
    id: "P-3",
    objective: "识别疑似拆分报销（临近审批阈值）",
    method: "确定性规则 split_expense",
    riskType: "split_expense",
  },
  {
    id: "P-4",
    objective: "识别金额离群异常",
    method: "确定性规则 abnormal_amount",
    riskType: "abnormal_amount",
  },
];

function p(text: string, opts?: { bold?: boolean; italics?: boolean }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italics,
      }),
    ],
  });
}

function cell(
  text: string,
  widthDxa: number,
  opts?: { bold?: boolean; header?: boolean },
): TableCell {
  return new TableCell({
    borders: BORDERS,
    width: { size: widthDxa, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "—",
            bold: opts?.bold ?? opts?.header,
            size: opts?.header ? 18 : 18,
          }),
        ],
      }),
    ],
  });
}

function row(cells: TableCell[]): TableRow {
  return new TableRow({ children: cells });
}

function table(columnWidths: number[], rows: TableRow[]): Table {
  return new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths,
    rows,
  });
}

function wpRef(i: number): string {
  return `A-${i + 1}`;
}

function evidenceText(evidence: unknown): string {
  try {
    return JSON.stringify(evidence);
  } catch {
    return String(evidence);
  }
}

function coverTable(report: AuditReport): Table {
  const mat = report.meta?.materiality;
  const preparedAt = new Date().toISOString().slice(0, 10);
  const w = [2800, 6560];
  const kv = (k: string, v: string) =>
    row([cell(k, w[0], { bold: true }), cell(v, w[1])]);

  return table(w, [
    kv("工作底稿编号", `WP-EXP-${report.jobId.slice(0, 8)}`),
    kv("任务编号", report.jobId),
    kv("审计循环", "费用与报销（Expense cycle）"),
    kv("被审计期间", "【待项目组填写】"),
    kv("整体风险等级", RISK_LABEL[report.riskLevel] ?? report.riskLevel),
    kv("规则集版本", report.meta?.rulesetVersion ?? "n/a"),
    kv("运行模式", report.meta?.mode ?? "full"),
    ...(mat
      ? [
          kv("规划重要性", String(mat.planningMateriality)),
          kv("实际执行重要性", String(mat.performanceMateriality)),
          kv("明显微小错报临界值", String(mat.trivialThreshold)),
        ]
      : []),
    kv("编制人（Prepared by）", "AuditDraft AI（草稿） / ______________"),
    kv("编制日期", preparedAt),
    kv("复核人（Reviewed by）", "______________"),
    kv("复核日期", "______________"),
  ]);
}

function indexTable(report: AuditReport): Table | Paragraph {
  if (report.findings.length === 0) {
    return p("无例外事项索引。");
  }
  const w = [900, 1400, 2200, 900, 2200, 1760];
  const header = row([
    cell("W/P", w[0], { header: true }),
    cell("Finding ID", w[1], { header: true }),
    cell("风险类型", w[2], { header: true }),
    cell("严重度", w[3], { header: true }),
    cell("重要性影响", w[4], { header: true }),
    cell("复核状态", w[5], { header: true }),
  ]);
  const body = report.findings.map((f, i) =>
    row([
      cell(wpRef(i), w[0]),
      cell(f.findingId ?? `F-${i + 1}`, w[1]),
      cell(String(f.riskType), w[2]),
      cell(RISK_LABEL[f.severity] ?? f.severity, w[3]),
      cell(
        f.materialityImpact
          ? (IMPACT_LABEL[f.materialityImpact] ?? f.materialityImpact)
          : "—",
        w[4],
      ),
      cell(f.reviewerStatus ?? "open", w[5]),
    ]),
  );
  return table(w, [header, ...body]);
}

function procedureTable(report: AuditReport): Table {
  const counts = new Map<string, number>();
  for (const f of report.findings) {
    const key = String(f.riskType);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const w = [900, 3600, 2800, 2060];
  const header = row([
    cell("程序号", w[0], { header: true }),
    cell("程序目标", w[1], { header: true }),
    cell("执行方式", w[2], { header: true }),
    cell("结果", w[3], { header: true }),
  ]);
  const body = EXECUTED_PROCEDURES.map((proc) => {
    const n = counts.get(proc.riskType) ?? 0;
    return row([
      cell(proc.id, w[0]),
      cell(proc.objective, w[1]),
      cell(proc.method, w[2]),
      cell(n > 0 ? `例外 ${n} 条 → 见索引` : "未发现例外", w[3]),
    ]);
  });
  return table(w, [header, ...body]);
}

function exceptionDetailTable(f: AuditFinding, i: number): Table {
  const procs =
    f.recommendedProcedures && f.recommendedProcedures.length > 0
      ? f.recommendedProcedures
      : proceduresForRisk(String(f.riskType));
  const w = [2400, 6960];
  const kv = (k: string, v: string) =>
    row([cell(k, w[0], { bold: true }), cell(v, w[1])]);

  return table(w, [
    kv("W/P 编号", wpRef(i)),
    kv("Finding ID", f.findingId ?? `F-${i + 1}`),
    kv("风险类型", String(f.riskType)),
    kv("严重度", RISK_LABEL[f.severity] ?? f.severity),
    kv("触发规则", f.triggeredRule),
    kv("数据证据", evidenceText(f.evidence)),
    kv("审计准则引用", f.standardRef ?? "—"),
    kv("风险解释", f.explanation),
    kv(
      "重要性影响",
      f.materialityImpact
        ? (IMPACT_LABEL[f.materialityImpact] ?? f.materialityImpact)
        : "—",
    ),
    kv("建议进一步程序", procs.map((x, j) => `${j + 1}. ${x}`).join("； ")),
    kv("复核状态", f.reviewerStatus ?? "open"),
  ]);
}

function workpaperParagraphs(workpaper: string): Paragraph[] {
  if (!workpaper.trim()) return [p("（无叙述正文）")];
  return workpaper
    .split(/\r?\n/)
    .map((line) => p(line.length > 0 ? line : " "));
}

/** 把审计报告渲染为 Word 文档 Buffer。 */
export async function exportWordReport(report: AuditReport): Promise<Buffer> {
  const indexBlock = indexTable(report);
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("审计工作底稿（费用循环）")],
    }),
    p(
      "AI-assisted draft — subject to engagement review. 本底稿须经项目组复核后方可归档，不构成审计意见。",
      { italics: true },
    ),
    p(" "),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("封面与签核")],
    }),
    coverTable(report),
    p(" "),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("一、工作底稿索引（例外事项）")],
    }),
    ...(indexBlock instanceof Paragraph ? [indexBlock] : [indexBlock]),
    p(" "),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("二、已执行程序对照表")],
    }),
    p("以下程序由确定性规则引擎全量执行；结果可复现，不依赖大模型。", {
      italics: true,
    }),
    procedureTable(report),
    p(" "),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("三、例外事项明细")],
    }),
  ];

  if (report.findings.length === 0) {
    children.push(p("未发现例外事项。"));
  } else {
    report.findings.forEach((f, i) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun(
              `${wpRef(i)} · ${f.riskType}（${RISK_LABEL[f.severity] ?? f.severity}）`,
            ),
          ],
        }),
        exceptionDetailTable(f, i),
        p(" "),
      );
    });
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("四、叙述正文（补充）")],
    }),
    p("以下为 AI/模板生成的叙述性补充，结构化结论以第一～三节表格为准。", {
      italics: true,
    }),
    ...workpaperParagraphs(report.workpaper),
    p(" "),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("五、结论与免责声明")],
    }),
    p(
      "以上发现由确定性规则引擎初筛生成，建议程序供执行层参考。最终结论与是否调整审计策略须由项目组专业判断确定。",
    ),
    p(
      "禁止用途：不得将本系统输出直接作为审计意见、监管报送或未经复核的对外结论。",
    ),
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
