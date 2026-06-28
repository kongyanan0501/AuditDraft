import { describe, expect, it } from "vitest";

import {
  abnormalAmount,
  duplicatePayment,
  missingApproval,
  runRules,
  splitExpense,
} from "@/lib/rules";
import type { Transaction } from "@/types/audit";

import { DEMO_TRANSACTIONS } from "./fixtures";

describe("规则引擎（确定性，无网络调用）", () => {
  it("duplicate_payment 命中演示数据行 1&2", () => {
    const findings = duplicatePayment(DEMO_TRANSACTIONS);
    expect(findings).toHaveLength(1);
    expect(findings[0].riskType).toBe("duplicate_payment");
    expect(findings[0].severity).toBe("high");
    expect(
      (findings[0].evidence as { transactionIds: string[] }).transactionIds,
    ).toEqual(["1", "2"]);
    // 可解释性：必带触发规则与证据
    expect(findings[0].triggeredRule).toBeTruthy();
    expect(findings[0].evidence).toBeDefined();
  });

  it("missing_approval 命中无审批大额行 4，忽略小额无审批行 1", () => {
    const findings = missingApproval(DEMO_TRANSACTIONS);
    expect(findings).toHaveLength(1);
    expect(
      (findings[0].evidence as { transactionId: string }).transactionId,
    ).toBe("4");
  });

  it("split_expense 命中同供应商多笔贴边阈值的支出", () => {
    const tx: Transaction[] = [
      { id: "a", vendor: "S", amount: 9000, approver: "x", invoiceId: "I1" },
      { id: "b", vendor: "S", amount: 9500, approver: "x", invoiceId: "I2" },
      { id: "c", vendor: "T", amount: 9200, approver: "x", invoiceId: "I3" },
    ];
    const findings = splitExpense(tx);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("medium");
    expect((findings[0].evidence as { vendor: string }).vendor).toBe("S");
  });

  it("abnormal_amount 在演示数据上不误报（离群不足）", () => {
    expect(abnormalAmount(DEMO_TRANSACTIONS)).toHaveLength(0);
  });

  it("abnormal_amount 能识别显著离群值", () => {
    // 注：用总体标准差时小样本的 |z| 上限为 (n-1)/√n，故需足够样本量才能超过阈值 2。
    const normal = Array.from({ length: 9 }, (_, i) => ({
      id: `n${i}`,
      vendor: "A",
      amount: 100 + i,
      approver: "x",
      invoiceId: `I${i}`,
    }));
    const tx: Transaction[] = [
      ...normal,
      { id: "out", vendor: "A", amount: 100000, approver: "x", invoiceId: "IX" },
    ];
    const findings = abnormalAmount(tx);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect((findings[0].evidence as { transactionId: string }).transactionId).toBe("out");
  });

  it("runRules 汇总演示数据：重复付款 + 无审批 共 2 条", () => {
    const findings = runRules(DEMO_TRANSACTIONS);
    const types = findings.map((f) => f.riskType).sort();
    expect(types).toEqual(["duplicate_payment", "missing_approval"]);
    // 每条结论都可解释
    for (const f of findings) {
      expect(f.triggeredRule).toBeTruthy();
      expect(f.evidence).toBeDefined();
      expect(f.explanation).toBeTruthy();
    }
  });
});
