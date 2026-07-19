import { describe, expect, it } from "vitest";

import { reconcileExpensePayments } from "@/lib/rules";
import type { Transaction } from "@/types/audit";

describe("expense ↔ payment reconcile", () => {
  it("flags unmatched expense, orphan payment, amount mismatch", () => {
    const expenses: Transaction[] = [
      {
        id: "E1",
        vendor: "A",
        amount: 100,
        approver: "x",
        invoiceId: "INV-1",
      },
      {
        id: "E2",
        vendor: "B",
        amount: 200,
        approver: "x",
        invoiceId: "INV-2",
      },
      {
        id: "E3",
        vendor: "C",
        amount: 300,
        approver: "x",
        invoiceId: "INV-MISS",
      },
    ];
    const payments: Transaction[] = [
      {
        id: "P1",
        vendor: "A",
        amount: 100,
        approver: "t",
        invoiceId: "INV-1",
      },
      {
        id: "P2",
        vendor: "B",
        amount: 180,
        approver: "t",
        invoiceId: "INV-2",
      },
      {
        id: "P3",
        vendor: "D",
        amount: 999,
        approver: "t",
        invoiceId: "INV-ONLY-PAY",
      },
    ];

    const findings = reconcileExpensePayments(expenses, payments);
    const types = findings.map((f) => f.riskType);

    expect(types).toContain("reconcile_unmatched_expense");
    expect(types).toContain("reconcile_amount_mismatch");
    expect(types).toContain("reconcile_orphan_payment");
  });
});
