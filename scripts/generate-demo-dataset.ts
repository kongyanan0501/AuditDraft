/**
 * Generate a reproducible ~3k-row EY demo expense CSV + planted-risk manifests.
 * Usage: npm run generate:demo-data
 * No network / LLM. Fixed seed → stable row ids & planted positions.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED = 42;
const TARGET_ROWS = 3000;

const VENDORS_NORMAL = [
  "Office Co",
  "City Supplies",
  "North Logistics",
  "Beacon Soft",
  "Harbor Print",
  "Summit Travel",
  "Delta Catering",
  "Pixel Ads",
  "Green Facilities",
  "Nova Consulting",
];

const APPROVERS = ["Alice", "Bob", "Carol", "David", "Eva", "Frank"];

export type PlantedRisk = {
  id: string;
  ruleId:
    | "duplicate_payment"
    | "missing_approval"
    | "split_expense"
    | "abnormal_amount";
  severity: "high" | "medium";
  transactionIds: string[];
  vendor: string;
  talkTrack: string;
};

/** Mulberry32 — tiny deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Row = {
  id: string;
  vendor: string;
  amount: number;
  approver: string;
  invoice_id: string;
};

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Row[]): string {
  const header = "id,vendor,amount,approver,invoice_id";
  const lines = rows.map(
    (r) =>
      [
        csvEscape(r.id),
        csvEscape(r.vendor),
        csvEscape(r.amount),
        csvEscape(r.approver),
        csvEscape(r.invoice_id),
      ].join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

function buildPlantedMarkdown(planted: PlantedRisk[]): string {
  const byRule = (rule: PlantedRisk["ruleId"]) =>
    planted.filter((p) => p.ruleId === rule);

  const section = (title: string, rule: PlantedRisk["ruleId"]) => {
    const items = byRule(rule);
    const rows = items
      .map(
        (p) =>
          `| ${p.id} | ${p.vendor} | ${p.transactionIds.join(", ")} | ${p.severity} | ${p.talkTrack} |`,
      )
      .join("\n");
    return `### ${title}（${items.length}）\n\n| 埋雷 ID | 供应商 | 交易 ID | 等级 | 路演一句 |\n| --- | --- | --- | --- | --- |\n${rows}\n`;
  };

  return `# EY 演示集埋雷说明

> 对应文件：\`samples/ey_expense_demo_3k.csv\`  
> 机器清单：\`samples/planted_risks.json\`  
> 生成：\`npm run generate:demo-data\`（seed=${SEED}）  
> 断言：\`npm run assert:planted\`

本集为**脱敏合成数据**，仅用于安永华明 AI 赛演示与评测，不含真实客户信息。

## 规模

- 目标行数：≥ ${TARGET_ROWS}（生成器固定输出 ${TARGET_ROWS} 行）
- 表头：\`id,vendor,amount,approver,invoice_id\`（兼容现有 parser）
- 正常交易占比：设计上 ≥ 85%（其余为埋雷相关行）

## 埋雷一览

${section("重复付款 / 重复发票", "duplicate_payment")}
${section("无审批大额", "missing_approval")}
${section("拆分报销", "split_expense")}
${section("金额离群", "abnormal_amount")}

## 路演指法

1. 上传 CSV → 等规则出 findings（完整模式可再等底稿）。
2. 打开本文件，任选一类风险，用「交易 ID」在风险卡 evidence 里对上号。
3. 强调：这些结论来自**确定性规则引擎**，同输入同输出。
`;
}

function main(): void {
  const rand = mulberry32(SEED);
  const rows: Row[] = [];
  const planted: PlantedRisk[] = [];
  let nextId = 1;

  const takeId = (): string => String(nextId++);

  // --- Plant: 8 duplicate clusters (2 rows each) ---
  for (let i = 1; i <= 8; i++) {
    const vendor = `DupVendor-${String(i).padStart(2, "0")}`;
    const amount = 4000 + i * 100;
    const invoice = `DUP-INV-${String(i).padStart(3, "0")}`;
    const id1 = takeId();
    const id2 = takeId();
    rows.push(
      { id: id1, vendor, amount, approver: "Alice", invoice_id: invoice },
      { id: id2, vendor, amount, approver: "Alice", invoice_id: invoice },
    );
    planted.push({
      id: `plant-dup-${i}`,
      ruleId: "duplicate_payment",
      severity: "high",
      transactionIds: [id1, id2],
      vendor,
      talkTrack: `同供应商同金额同发票号出现 2 笔，典型重复付款红旗。`,
    });
  }

  // --- Plant: 10 missing approval ---
  for (let i = 1; i <= 10; i++) {
    const id = takeId();
    const vendor = `NoAppr-${String(i).padStart(2, "0")}`;
    const amount = 12000 + i * 1500;
    rows.push({
      id,
      vendor,
      amount,
      approver: "",
      invoice_id: `NA-INV-${String(i).padStart(3, "0")}`,
    });
    planted.push({
      id: `plant-na-${i}`,
      ruleId: "missing_approval",
      severity: "high",
      transactionIds: [id],
      vendor,
      talkTrack: `金额超过审批阈值 10000 且无审批人。`,
    });
  }

  // --- Plant: 6 split clusters (2 near-threshold rows each) ---
  for (let i = 1; i <= 6; i++) {
    const vendor = `SplitCo-${String(i).padStart(2, "0")}`;
    const id1 = takeId();
    const id2 = takeId();
    const a1 = 8000 + i * 50;
    const a2 = 8500 + i * 40;
    rows.push(
      {
        id: id1,
        vendor,
        amount: a1,
        approver: "Bob",
        invoice_id: `SP-INV-${i}-A`,
      },
      {
        id: id2,
        vendor,
        amount: a2,
        approver: "Bob",
        invoice_id: `SP-INV-${i}-B`,
      },
    );
    planted.push({
      id: `plant-split-${i}`,
      ruleId: "split_expense",
      severity: "medium",
      transactionIds: [id1, id2],
      vendor,
      talkTrack: `两笔贴边低于 10000，疑似拆分规避审批。`,
    });
  }

  // --- Plant: 4 abnormal mega amounts (with approver so focus is z-score) ---
  const mega = [280000, 420000, 550000, 780000];
  for (let i = 0; i < mega.length; i++) {
    const id = takeId();
    const vendor = `MegaPay-${String(i + 1).padStart(2, "0")}`;
    rows.push({
      id,
      vendor,
      amount: mega[i]!,
      approver: "Carol",
      invoice_id: `MEGA-INV-${String(i + 1).padStart(3, "0")}`,
    });
    planted.push({
      id: `plant-abn-${i + 1}`,
      ruleId: "abnormal_amount",
      severity: "medium",
      transactionIds: [id],
      vendor,
      talkTrack: `金额相对总体均值显著离群（z-score）。`,
    });
  }

  // --- Fill remaining with normal rows ---
  while (rows.length < TARGET_ROWS) {
    const id = takeId();
    const vendor =
      VENDORS_NORMAL[Math.floor(rand() * VENDORS_NORMAL.length)]!;
    // Keep normals well below split band and approval threshold to limit noise.
    const amount = Math.round(120 + rand() * 4800);
    const approver = APPROVERS[Math.floor(rand() * APPROVERS.length)]!;
    rows.push({
      id,
      vendor,
      amount,
      approver,
      invoice_id: `N-INV-${id.padStart(5, "0")}`,
    });
  }

  // Stable order by numeric id (already insertion order).
  const samplesDir = join(ROOT, "samples");
  mkdirSync(samplesDir, { recursive: true });

  const csvPath = join(samplesDir, "ey_expense_demo_3k.csv");
  writeFileSync(csvPath, toCsv(rows), "utf8");

  const plantedPath = join(samplesDir, "planted_risks.json");
  writeFileSync(
    plantedPath,
    JSON.stringify(
      {
        seed: SEED,
        dataset: "ey_expense_demo_3k.csv",
        rowCount: rows.length,
        planted,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const mdPath = join(samplesDir, "EY_DEMO_PLANTED_RISKS.md");
  writeFileSync(mdPath, buildPlantedMarkdown(planted), "utf8");

  const plantedRows = new Set(planted.flatMap((p) => p.transactionIds)).size;
  const normalPct = (((rows.length - plantedRows) / rows.length) * 100).toFixed(
    1,
  );

  console.log(`[generate-demo-data] wrote ${rows.length} rows → ${csvPath}`);
  console.log(
    `[generate-demo-data] planted ${planted.length} cases (${plantedRows} rows, normal≈${normalPct}%)`,
  );
  console.log(`[generate-demo-data] manifest → ${plantedPath}`);
  console.log(`[generate-demo-data] handbook → ${mdPath}`);
}

main();
