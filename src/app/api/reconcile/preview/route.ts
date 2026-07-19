import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { enrichFindings } from "@/lib/audit/finalizeReport";
import { parseAuditFile } from "@/lib/parse";
import { reconcileExpensePayments } from "@/lib/rules";
import { requireUser } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

/** Demo reconcile using samples/ey_expense_side.csv + ey_payment_side.csv */
export async function POST(): Promise<Response> {
  try {
    await requireUser();
    const root = process.cwd();
    const expenses = parseAuditFile(
      readFileSync(join(root, "samples", "ey_expense_side.csv")),
      "ey_expense_side.csv",
    );
    const payments = parseAuditFile(
      readFileSync(join(root, "samples", "ey_payment_side.csv")),
      "ey_payment_side.csv",
    );
    const findings = enrichFindings(
      reconcileExpensePayments(expenses, payments),
    );
    return NextResponse.json({
      expenseCount: expenses.length,
      paymentCount: payments.length,
      findingCount: findings.length,
      findings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "reconcile failed";
    const status = message.includes("未登录") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
