import * as XLSX from "xlsx";

import type { Transaction } from "@/types/audit";

// 解析层：Excel / CSV 原始文件 → 结构化 Transaction[]（列映射 + 校验）。
// 纯函数（无网络 / 无 DB），便于单测；阶段3 的 parseData 由此模块承担。
// 失败时抛出可读的 ParseError，便于前端展示与任务 failed 落库。

export class ParseError extends Error {
  constructor(message: string) {
    super(`[parse] ${message}`);
    this.name = "ParseError";
  }
}

/** 表头别名 → 规范字段（小写、去空白后匹配）。 */
const HEADER_ALIASES: Record<string, keyof Transaction> = {
  id: "id",
  序号: "id",
  vendor: "vendor",
  供应商: "vendor",
  amount: "amount",
  金额: "amount",
  approver: "approver",
  审批人: "approver",
  invoice_id: "invoiceId",
  invoiceid: "invoiceId",
  invoice: "invoiceId",
  发票号: "invoiceId",
  发票: "invoiceId",
};

const REQUIRED_FIELDS: (keyof Transaction)[] = ["vendor", "amount"];

function normalizeHeader(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isNullish(value: unknown): boolean {
  if (value == null) return true;
  const v = String(value).trim().toLowerCase();
  return v === "" || v === "null" || v === "na" || v === "n/a";
}

/**
 * 解析审计原始文件（CSV / XLS / XLSX）为 Transaction[]。
 * @param buffer 文件二进制
 * @param filename 文件名（仅用于错误信息）
 */
export function parseAuditFile(buffer: Buffer, filename = "file"): Transaction[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch (err) {
    throw new ParseError(
      `无法读取文件 ${filename}：${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) throw new ParseError(`文件 ${filename} 不含任何工作表`);

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
  });
  if (matrix.length < 2) {
    throw new ParseError("文件没有数据行（至少需要表头 + 1 行数据）");
  }

  const headerRow = matrix[0] as unknown[];
  const fieldByCol = new Map<number, keyof Transaction>();
  headerRow.forEach((cell, col) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field) fieldByCol.set(col, field);
  });

  const mappedFields = new Set(fieldByCol.values());
  const missing = REQUIRED_FIELDS.filter((f) => !mappedFields.has(f));
  if (missing.length > 0) {
    throw new ParseError(
      `缺少必要列：${missing.join(" / ")}（已识别表头：${headerRow.join(", ")}）`,
    );
  }

  const transactions: Transaction[] = [];
  matrix.slice(1).forEach((row, i) => {
    const rowNo = i + 2; // 表头占第 1 行
    const cells = row as unknown[];
    const record: Partial<Record<keyof Transaction, unknown>> = {};
    for (const [col, field] of fieldByCol) {
      record[field] = cells[col];
    }

    const vendor = String(record.vendor ?? "").trim();
    if (!vendor) {
      throw new ParseError(`第 ${rowNo} 行 vendor 为空`);
    }

    const amountRaw = record.amount;
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : Number(String(amountRaw ?? "").replace(/[,\s¥$]/g, ""));
    if (!Number.isFinite(amount)) {
      throw new ParseError(`第 ${rowNo} 行 amount 非法：${String(amountRaw)}`);
    }

    transactions.push({
      id: isNullish(record.id) ? String(rowNo - 1) : String(record.id),
      vendor,
      amount,
      approver: isNullish(record.approver) ? null : String(record.approver).trim(),
      invoiceId: isNullish(record.invoiceId)
        ? ""
        : String(record.invoiceId).trim(),
    });
  });

  if (transactions.length === 0) {
    throw new ParseError("未解析出任何有效交易记录");
  }
  return transactions;
}
