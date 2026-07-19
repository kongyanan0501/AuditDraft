/**
 * Build evals/golden/expense_v1.json from planted_risks + normal-row negatives.
 * Usage: npm run build:golden
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type Planted = {
  id: string;
  ruleId: string;
  transactionIds: string[];
  talkTrack: string;
};

type Case = {
  id: string;
  transactionIds: string[];
  expectedRuleIds: string[];
  shouldFire: boolean;
  notes: string;
};

function parseCsvRows(csv: string): {
  id: string;
  vendor: string;
  amount: number;
  approver: string;
  invoice: string;
}[] {
  return csv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [id, vendor, amount, approver, invoice] = line.split(",");
      return {
        id: id!,
        vendor: vendor!,
        amount: Number(amount),
        approver: approver ?? "",
        invoice: invoice!,
      };
    });
}

function main(): void {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "samples", "planted_risks.json"), "utf8"),
  ) as { planted: Planted[]; dataset: string };

  const csv = readFileSync(
    join(ROOT, "samples", manifest.dataset),
    "utf8",
  );
  const rows = parseCsvRows(csv);
  const plantedIds = new Set(
    manifest.planted.flatMap((p) => p.transactionIds),
  );
  const normals = rows.filter((r) => !plantedIds.has(r.id));

  const positives: Case[] = manifest.planted.map((p) => ({
    id: p.id,
    transactionIds: p.transactionIds,
    expectedRuleIds: [p.ruleId],
    shouldFire: true,
    notes: p.talkTrack,
  }));

  const negMissing: Case[] = normals
    .filter((n) => n.amount <= 10000 && n.approver.trim() !== "")
    .slice(0, 45)
    .map((n, i) => ({
      id: `neg-na-${i + 1}`,
      transactionIds: [n.id],
      expectedRuleIds: ["missing_approval"],
      shouldFire: false,
      notes: "正常已审批/未超阈值 — 不应触发 missing_approval",
    }));

  const byVendor = new Map<string, typeof normals>();
  for (const n of normals) {
    const list = byVendor.get(n.vendor) ?? [];
    list.push(n);
    byVendor.set(n.vendor, list);
  }

  const negDup: Case[] = [];
  for (const [, list] of byVendor) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length - 1 && negDup.length < 25; i++) {
      const a = list[i]!;
      const b = list[i + 1]!;
      if (a.amount === b.amount && a.invoice === b.invoice) continue;
      negDup.push({
        id: `neg-dup-${negDup.length + 1}`,
        transactionIds: [a.id, b.id],
        expectedRuleIds: ["duplicate_payment"],
        shouldFire: false,
        notes: "同供应商但金额/发票不同 — 不应触发 duplicate_payment",
      });
    }
    if (negDup.length >= 25) break;
  }

  // Approved large amounts — should not fire missing_approval
  const negApprovedLarge: Case[] = normals
    .filter((n) => n.amount > 10000 && n.approver.trim() !== "")
    .slice(0, 15)
    .map((n, i) => ({
      id: `neg-appr-large-${i + 1}`,
      transactionIds: [n.id],
      expectedRuleIds: ["missing_approval"],
      shouldFire: false,
      notes: "大额但有审批人 — 不应触发 missing_approval",
    }));

  // Ordinary small amounts — must not appear as abnormal_amount evidence
  const negAbn: Case[] = normals
    .filter((n) => n.amount < 5000)
    .slice(0, 25)
    .map((n, i) => ({
      id: `neg-abn-${i + 1}`,
      transactionIds: [n.id],
      expectedRuleIds: ["abnormal_amount"],
      shouldFire: false,
      notes: "普通小额 — 不应作为 abnormal_amount 证据行",
    }));

  // Isolated near-threshold rows: run subset eval is encoded as notes;
  // use unique synthetic vendor pairs that are NOT both near-threshold.
  const negSplit: Case[] = normals.slice(0, 12).map((n, i) => ({
    id: `neg-split-${i + 1}`,
    transactionIds: [n.id],
    expectedRuleIds: ["split_expense"],
    shouldFire: false,
    notes: "普通行 — 不应出现在 split_expense 证据中",
  }));

  const cases = [
    ...positives,
    ...negMissing,
    ...negDup,
    ...negApprovedLarge,
    ...negAbn,
    ...negSplit,
  ];

  const out = {
    version: "expense_v1",
    dataset: manifest.dataset,
    rulesetVersion: "rules-v1",
    thresholds: {
      recallMin: 0.95,
      precisionMin: 0.9,
      explainabilityRequired: true,
    },
    cases,
  };

  const dir = join(ROOT, "evals", "golden");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "expense_v1.json");
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `[build:golden] ${cases.length} cases (pos=${positives.length}) → ${path}`,
  );
}

main();
