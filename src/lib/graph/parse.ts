import type { Transaction } from "@/types/audit";

// 轻量 CSV → Transaction[]（仅支持无引号转义的简单 CSV，用于 demo / 测试）。
// 完整的 Excel/CSV 解析与列映射在阶段 3 的 parseData 中实现，这里保持最小可用。

const COLUMN_ALIASES: Record<string, keyof Transaction> = {
  id: "id",
  vendor: "vendor",
  amount: "amount",
  approver: "approver",
  invoice_id: "invoiceId",
  invoiceid: "invoiceId",
};

function isNullish(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "" || v === "null" || v === "na" || v === "n/a";
}

/** 解析简单 CSV 文本为 Transaction[]。识别 id/vendor/amount/approver/invoice_id 列。 */
export function parseCsv(csv: string): Transaction[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows.map((line, rowIndex) => {
    const cells = line.split(",").map((c) => c.trim());
    const record: Record<string, unknown> = {};

    headers.forEach((header, i) => {
      const key = COLUMN_ALIASES[header];
      const raw = cells[i] ?? "";
      if (!key) {
        record[header] = raw;
        return;
      }
      if (key === "amount") {
        record.amount = Number(raw.replace(/[, ]/g, ""));
      } else if (key === "approver") {
        record.approver = isNullish(raw) ? null : raw;
      } else {
        record[key] = raw;
      }
    });

    return {
      id: String(record.id ?? rowIndex + 1),
      vendor: String(record.vendor ?? ""),
      amount: typeof record.amount === "number" ? record.amount : 0,
      approver: (record.approver as string | null) ?? null,
      invoiceId: String(record.invoiceId ?? ""),
      ...record,
    } as Transaction;
  });
}
