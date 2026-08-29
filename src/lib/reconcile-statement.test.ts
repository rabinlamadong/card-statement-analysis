import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

describe("reconcileTransactions", () => {
  it("drops later copies when the statement footer requires it", () => {
    const rows = [
      txn({ description: "A", amount: -10, y: 200 }),
      txn({ description: "B", amount: -20, y: 190 }),
      txn({ description: "A", amount: -10, y: 180 }),
      txn({ description: "B", amount: -20, y: 170 }),
    ];
    const result = reconcileTransactions(rows, 100, 70);
    assert.deepEqual(amounts(result.transactions), [-10, -20]);
    assert.equal(result.residual, 0);
  });

  it("keeps real interleaved repeats when the books already balance", () => {
    const rows = [
      txn({ description: "A", amount: 10, y: 200 }),
      txn({ description: "B", amount: 20, y: 190 }),
      txn({ description: "B", amount: 20, y: 180 }),
      txn({ description: "A", amount: 10, y: 170 }),
    ];
    const result = reconcileTransactions(rows, 0, 60);
    assert.deepEqual(amounts(result.transactions), [10, 20, 20, 10]);
  });

  it("keeps both copies when no subset explains the gap", () => {
    const rows = [
      txn({ description: "A", amount: -5, y: 200 }),
      txn({ description: "A", amount: -5, y: 190 }),
    ];
    const result = reconcileTransactions(rows, 20, 5);
    assert.deepEqual(amounts(result.transactions), [-5, -5]);
    assert.equal(result.residual, 5);
  });
});
