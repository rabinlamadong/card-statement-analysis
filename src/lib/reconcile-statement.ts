import type { Transaction } from "@/lib/types";

const CENTS_TOLERANCE = 0;

export type ReconcileResult = {
  transactions: Transaction[];
  dropped: Transaction[];
  residual: number | null;
};

function cents(value: number): number {
  return Math.round(value * 100);
}

function tupleKey(txn: Transaction): string {
  return `${txn.date}|${txn.description}|${txn.amount.toFixed(2)}|${txn.cardLast4}`;
}

/**
 * Keep every geometrically distinct row unless the statement footer proves
 * some later copies of the same tuple are surplus.
 *
 * First occurrence of a (date, memo, amount, card) is never removed.
 * Later copies are removable only when a subset of them sums exactly to the
 * excess of register vs opening/closing balance.
 */
export function reconcileTransactions(
  transactions: Transaction[],
  opening: number | null,
  closing: number | null,
): ReconcileResult {
  if (opening == null || closing == null) {
    return { transactions, dropped: [], residual: null };
  }

  const register = transactions.reduce((sum, txn) => sum + cents(txn.amount), 0);
  const target = cents(closing) - cents(opening);
  const excess = register - target;
  if (Math.abs(excess) <= CENTS_TOLERANCE) {
    return { transactions, dropped: [], residual: 0 };
  }

  const seen = new Map<string, number>();
  const candidates: Array<{ index: number; cents: number }> = [];
  for (const [index, txn] of transactions.entries()) {
    const key = tupleKey(txn);
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) {
      candidates.push({ index, cents: cents(txn.amount) });
    }
  }

  const dropIndexes = pickExcessCopies(candidates, excess);
  if (!dropIndexes) {
    return { transactions, dropped: [], residual: excess / 100 };
  }

  const dropSet = new Set(dropIndexes);
  return {
    transactions: transactions.filter((_, index) => !dropSet.has(index)),
    dropped: transactions.filter((_, index) => dropSet.has(index)),
    residual: 0,
  };
}

function pickExcessCopies(
  candidates: Array<{ index: number; cents: number }>,
  excess: number,
): number[] | null {
  const count = candidates.length;
  if (count === 0 || count > 22) return null;

  let best: number[] | null = null;
  const limit = 1 << count;
  for (let mask = 1; mask < limit; mask += 1) {
    let sum = 0;
    const indexes: number[] = [];
    for (let bit = 0; bit < count; bit += 1) {
      if (mask & (1 << bit)) {
        sum += candidates[bit].cents;
        indexes.push(candidates[bit].index);
      }
    }
    if (sum !== excess) continue;
    if (isBetterSubset(indexes, best)) best = indexes;
  }
  return best;
}

function isBetterSubset(next: number[], current: number[] | null): boolean {
  if (!current) return true;
  if (next.length !== current.length) return next.length < current.length;
  const nextLast = next[next.length - 1] ?? -1;
  const currentLast = current[current.length - 1] ?? -1;
  return nextLast > currentLast;
}
