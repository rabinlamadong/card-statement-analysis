import { reconcileTransactions } from "./reconcile-statement.ts";
import type { Transaction } from "./types.ts";

function txn(partial: Partial<Transaction> & { amount: number; description: string }): Transaction {
  return {
    id: "",
    date: partial.date ?? "2026-05-18",
    description: partial.description,
    amount: partial.amount,
    category: "Other",
    type: partial.amount < 0 ? "refund" : "purchase",
    merchant: partial.description,
    city: null,
    sourceFile: "t.pdf",
    statementId: "s",
    cardLast4: "9413",
    cardName: "Test",
    page: partial.page ?? 1,
    y: partial.y ?? 100,
  };
}

function amounts(rows: Transaction[]): number[] {
  return rows.map((row) => row.amount);
}

let failed = 0;
function check(name: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failed += 1;
    console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
  }
}

{
  const rows = [
    txn({ description: "A", amount: -10, y: 200 }),
    txn({ description: "B", amount: -20, y: 190 }),
    txn({ description: "A", amount: -10, y: 180 }),
    txn({ description: "B", amount: -20, y: 170 }),
  ];
  const result = reconcileTransactions(rows, 100, 70);
  check("echo pair dropped when footer requires it", amounts(result.transactions), [-10, -20]);
  check("echo pair residual", result.residual, 0);
}

{
  const rows = [
    txn({ description: "A", amount: 10, y: 200 }),
    txn({ description: "B", amount: 20, y: 190 }),
    txn({ description: "B", amount: 20, y: 180 }),
    txn({ description: "A", amount: 10, y: 170 }),
  ];
  const result = reconcileTransactions(rows, 0, 60);
  check("real interleaved repeats kept when books already balance", amounts(result.transactions), [10, 20, 20, 10]);
}

{
  const rows = [
    txn({ description: "A", amount: -5, y: 200 }),
    txn({ description: "A", amount: -5, y: 190 }),
  ];
  const result = reconcileTransactions(rows, 20, 5);
  check("no subset match keeps both", amounts(result.transactions), [-5, -5]);
  check("residual reported", result.residual, 5);
}

if (failed > 0) process.exit(1);
console.log("ok reconcile-statement cases");
