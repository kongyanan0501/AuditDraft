import type { AuditFinding, Transaction } from "@/types/audit";

/**
 * Multi-source reconciliation: expense claims vs payment ledger.
 * Match key: invoiceId (preferred) or vendor+amount.
 */

export type LedgerSide = "expense" | "payment";

export type LedgerRow = Transaction & { side: LedgerSide };

function matchKey(t: Transaction): string {
  const inv = String(t.invoiceId ?? "").trim();
  if (inv) return `inv:${inv}`;
  return `va:${t.vendor}__${t.amount}`;
}

/**
 * Compare expense vs payment rows; emit reconcile findings.
 */
export function reconcileExpensePayments(
  expenses: Transaction[],
  payments: Transaction[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const payByKey = new Map<string, Transaction[]>();
  for (const p of payments) {
    const key = matchKey(p);
    const bucket = payByKey.get(key) ?? [];
    bucket.push(p);
    payByKey.set(key, bucket);
  }

  const usedPay = new Set<string>();

  for (const e of expenses) {
    const key = matchKey(e);
    const matches = payByKey.get(key) ?? [];
    if (matches.length === 0) {
      findings.push({
        riskType: "reconcile_unmatched_expense",
        severity: "high",
        triggeredRule:
          "reconcile: expense has no matching payment (invoiceId or vendor+amount)",
        evidence: {
          expenseId: e.id,
          vendor: e.vendor,
          amount: e.amount,
          invoiceId: e.invoiceId,
          matchKey: key,
        },
        standardRef:
          "《中国注册会计师审计准则第 1301 号——审计证据》（外部证据与账面勾稽）",
        explanation: `报销 ${e.id}（${e.vendor} / ${e.amount}）未找到对应付款记录，存在虚报或未付款风险。`,
      });
      continue;
    }
    const pay = matches.find((p) => !usedPay.has(p.id)) ?? matches[0]!;
    usedPay.add(pay.id);
    if (Math.abs(pay.amount - e.amount) > 0.01) {
      findings.push({
        riskType: "reconcile_amount_mismatch",
        severity: "medium",
        triggeredRule: "reconcile: expense amount ≠ payment amount",
        evidence: {
          expenseId: e.id,
          paymentId: pay.id,
          expenseAmount: e.amount,
          paymentAmount: pay.amount,
          invoiceId: e.invoiceId,
        },
        standardRef:
          "《中国注册会计师审计准则第 1301 号——审计证据》（金额一致性）",
        explanation: `报销 ${e.id} 金额 ${e.amount} 与付款 ${pay.id} 金额 ${pay.amount} 不一致。`,
      });
    }
  }

  for (const p of payments) {
    if (usedPay.has(p.id)) continue;
    // payment not matched to any expense
    const key = matchKey(p);
    const hasExpense = expenses.some((e) => matchKey(e) === key);
    if (!hasExpense) {
      findings.push({
        riskType: "reconcile_orphan_payment",
        severity: "high",
        triggeredRule:
          "reconcile: payment has no matching expense (invoiceId or vendor+amount)",
        evidence: {
          paymentId: p.id,
          vendor: p.vendor,
          amount: p.amount,
          invoiceId: p.invoiceId,
          matchKey: key,
        },
        standardRef:
          "《中国注册会计师审计准则第 1141 号——财务报表审计中与舞弊相关的责任》",
        explanation: `付款 ${p.id}（${p.vendor} / ${p.amount}）无对应报销单，需查证是否存在无支持付款。`,
      });
    }
  }

  return findings;
}
