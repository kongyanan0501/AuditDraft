import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ParseError, parseAuditFile } from "@/lib/parse";
import { runRules } from "@/lib/rules";

const SAMPLE_CSV = readFileSync(
  path.join(process.cwd(), "samples/expense_transactions.csv"),
);

describe("解析层 parseAuditFile（CSV/Excel）", () => {
  it("解析演示数据集为 11 条交易，列映射正确", () => {
    const tx = parseAuditFile(SAMPLE_CSV, "expense_transactions.csv");
    expect(tx).toHaveLength(11);
    expect(tx[0]).toMatchObject({
      id: "1",
      vendor: "ABC Corp",
      amount: 5000,
      approver: null,
      invoiceId: "INV-1001",
    });
    // 空审批人 → null；大额含审批人保留
    expect(tx[3].approver).toBeNull();
    expect(tx[2].approver).toBe("John");
  });

  it("演示数据集经规则引擎可识别全部四类内置风险", () => {
    const tx = parseAuditFile(SAMPLE_CSV);
    const types = new Set(runRules(tx).map((f) => f.riskType));
    expect(types.has("duplicate_payment")).toBe(true);
    expect(types.has("missing_approval")).toBe(true);
    expect(types.has("split_expense")).toBe(true);
    expect(types.has("abnormal_amount")).toBe(true);
  });

  it("缺少必要列时抛出可读 ParseError", () => {
    const bad = Buffer.from("foo,bar\n1,2\n", "utf8");
    expect(() => parseAuditFile(bad, "bad.csv")).toThrow(ParseError);
  });

  it("金额非法时抛出可读 ParseError（含行号）", () => {
    const bad = Buffer.from(
      "vendor,amount\nABC,not-a-number\n",
      "utf8",
    );
    expect(() => parseAuditFile(bad, "bad.csv")).toThrow(/amount/);
  });

  it("无数据行时抛错", () => {
    const bad = Buffer.from("vendor,amount\n", "utf8");
    expect(() => parseAuditFile(bad)).toThrow(ParseError);
  });
});
