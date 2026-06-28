import type { Transaction } from "@/types/audit";

// 来自 initial.md §10 的冲奖演示数据集 expense_transactions.csv。
export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "1", vendor: "ABC", amount: 5000, approver: null, invoiceId: "INV-1001" },
  { id: "2", vendor: "ABC", amount: 5000, approver: null, invoiceId: "INV-1001" },
  { id: "3", vendor: "XYZ", amount: 12000, approver: "John", invoiceId: "INV-2001" },
  { id: "4", vendor: "LMN", amount: 20000, approver: null, invoiceId: "INV-3001" },
];
