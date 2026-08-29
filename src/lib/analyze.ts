import { monthLabel } from "@/lib/format";
import type {
  Category,
  DashboardData,
  Insight,
  MerchantRollup,
  RecurringCharge,
  Statement,
  Transaction,
} from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function detectCurrency(statements: Statement[]): string {
  const sample = statements.map((s) => `${s.issuer} ${s.cardName}`).join(" ");
  if (/emirates|aed/i.test(sample)) return "AED";
  return "USD";
}

export function analyze(statements: Statement[], scannedAt = new Date().toISOString()): Omit<
  DashboardData,
  "statementsDir" | "errors"
> {
  const transactions = statements
    .flatMap((s) => s.transactions)
    .sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));

  const purchases = transactions.filter((t) => t.type === "purchase" && t.amount > 0);
  const paymentTxns = transactions.filter((t) => t.type === "payment");
  const refundTxns = transactions.filter((t) => t.type === "refund");
  const creditTxns = transactions.filter((t) => t.type === "credit");
  const reversalTxns = transactions.filter((t) => t.type === "reversal");
  const spend = purchases.reduce((sum, t) => sum + t.amount, 0);
  const payments = paymentTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const refunds = refundTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const credits = creditTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const reversals = reversalTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const adjustments = [...refundTxns, ...creditTxns, ...reversalTxns].sort(
    (a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description),
  );

  const months = new Map<
    string,
    { spend: number; payments: number; refunds: number; purchaseCount: number; lineCount: number }
  >();
  for (const txn of transactions) {
    const key = monthKey(txn.date);
    const bucket = months.get(key) ?? {
      spend: 0,
      payments: 0,
      refunds: 0,
      purchaseCount: 0,
      lineCount: 0,
    };
    bucket.lineCount += 1;
    if (txn.type === "purchase" && txn.amount > 0) {
      bucket.spend += txn.amount;
      bucket.purchaseCount += 1;
    }
    if (txn.type === "payment") bucket.payments += Math.abs(txn.amount);
    if (txn.type === "refund") bucket.refunds += Math.abs(txn.amount);
    months.set(key, bucket);
  }

  const byMonth = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      label: monthLabel(month),
      spend: Number(value.spend.toFixed(2)),
      payments: Number(value.payments.toFixed(2)),
      refunds: Number(value.refunds.toFixed(2)),
      purchaseCount: value.purchaseCount,
      lineCount: value.lineCount,
    }));

  const categorySpend = new Map<Category, number>();
  for (const txn of purchases) {
    categorySpend.set(txn.category, (categorySpend.get(txn.category) ?? 0) + txn.amount);
  }
  const byCategory = CATEGORIES.map((category) => {
    const value = categorySpend.get(category) ?? 0;
    return { category, spend: Number(value.toFixed(2)), share: spend > 0 ? value / spend : 0 };
  })
    .filter((row) => row.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const cardMap = new Map<string, { cardName: string; last4: string; spend: number; count: number }>();
  for (const txn of purchases) {
    const key = txn.cardLast4;
    const bucket = cardMap.get(key) ?? {
      cardName: txn.cardName,
      last4: txn.cardLast4,
      spend: 0,
      count: 0,
    };
    bucket.spend += txn.amount;
    bucket.count += 1;
    cardMap.set(key, bucket);
  }
  const byCard = [...cardMap.values()]
    .map((row) => ({ ...row, spend: Number(row.spend.toFixed(2)) }))
    .sort((a, b) => b.spend - a.spend);

  const cityMap = new Map<string, { city: string; spend: number; count: number }>();
  for (const txn of purchases) {
    const city = txn.city ?? "Unspecified";
    const bucket = cityMap.get(city) ?? { city, spend: 0, count: 0 };
    bucket.spend += txn.amount;
    bucket.count += 1;
    cityMap.set(city, bucket);
  }
  const byCity = [...cityMap.values()]
    .map((row) => ({ ...row, spend: Number(row.spend.toFixed(2)) }))
    .sort((a, b) => b.spend - a.spend);

  const merchantMap = new Map<string, MerchantRollup>();
  for (const txn of purchases) {
    const bucket = merchantMap.get(txn.merchant) ?? {
      merchant: txn.merchant,
      category: txn.category,
      spend: 0,
      count: 0,
    };
    bucket.spend += txn.amount;
    bucket.count += 1;
    merchantMap.set(txn.merchant, bucket);
  }
  const merchants = [...merchantMap.values()]
    .map((row) => ({ ...row, spend: Number(row.spend.toFixed(2)) }))
    .sort((a, b) => b.spend - a.spend);

  const recurring = detectRecurring(purchases);
  const largestPurchase = purchases.reduce<Transaction | null>((best, txn) => {
    if (!best || txn.amount > best.amount) return txn;
    return best;
  }, null);

  const uniqueCards = new Set(purchases.map((txn) => txn.cardLast4));
  const averageMonthlySpend = byMonth.length ? spend / byMonth.length : 0;

  const currency = detectCurrency(statements);

  return {
    scannedAt,
    currency,
    statements,
    transactions,
    insights: buildInsights({
      statements,
      purchases,
      byMonth,
      byCategory,
      byCity,
      merchants,
      recurring,
      largestPurchase,
      spend,
      refunds,
      credits,
      reversals,
      currency,
    }),
    merchants,
    recurring,
    byCity,
    adjustments,
    totals: {
      spend: Number(spend.toFixed(2)),
      payments: Number(payments.toFixed(2)),
      refunds: Number(refunds.toFixed(2)),
      credits: Number(credits.toFixed(2)),
      reversals: Number(reversals.toFixed(2)),
      transactionCount: transactions.length,
      purchaseCount: purchases.length,
      averageMonthlySpend: Number(averageMonthlySpend.toFixed(2)),
      largestPurchase,
      statementCount: statements.length,
      cardCount: uniqueCards.size,
      monthCount: byMonth.length,
    },
    byMonth,
    byCategory,
    byCard,
  };
}

function detectRecurring(purchases: Transaction[]): RecurringCharge[] {
  const byMerchant = new Map<string, Transaction[]>();
  for (const txn of purchases) {
    const list = byMerchant.get(txn.merchant) ?? [];
    list.push(txn);
    byMerchant.set(txn.merchant, list);
  }

  const recurring: RecurringCharge[] = [];
  for (const [merchant, txns] of byMerchant) {
    if (txns.length < 3) continue;
    const amounts = txns.map((t) => t.amount);
    const typical = median(amounts);
    const close = amounts.filter((n) => Math.abs(n - typical) <= Math.max(1, typical * 0.08));
    if (close.length < 3) continue;

    const months = new Set(txns.map((t) => monthKey(t.date)));
    if (months.size < 3) continue;

    recurring.push({
      merchant,
      category: txns[0].category,
      typicalAmount: Number(typical.toFixed(2)),
      occurrences: txns.length,
      lastDate: txns.map((t) => t.date).sort().at(-1) ?? txns[0].date,
      monthlyEstimate: Number(typical.toFixed(2)),
    });
  }

  return recurring.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
}

function money(value: number, currency: string): string {
  return value.toLocaleString("en-AE", { style: "currency", currency, currencyDisplay: "code" });
}

function buildInsights(input: {
  statements: Statement[];
  purchases: Transaction[];
  byMonth: DashboardData["byMonth"];
  byCategory: DashboardData["byCategory"];
  byCity: DashboardData["byCity"];
  merchants: MerchantRollup[];
  recurring: RecurringCharge[];
  largestPurchase: Transaction | null;
  spend: number;
  refunds: number;
  credits: number;
  reversals: number;
  currency: string;
}): Insight[] {
  const insights: Insight[] = [];
  const {
    byMonth,
    byCategory,
    byCity,
    merchants,
    recurring,
    largestPurchase,
    spend,
    refunds,
    credits,
    reversals,
    statements,
    purchases,
    currency,
  } = input;

  const topNamed = byCategory.find((row) => row.category !== "Other");
  if (topNamed && spend > 0) {
    const top = topNamed;
    insights.push({
      id: "top-category",
      title: `${top.category} leads spending`,
      detail: `${top.category} is ${Math.round(top.share * 100)}% of purchases — ${money(top.spend, currency)} across the loaded statements.`,
      tone: top.share > 0.35 ? "watch" : "neutral",
    });
  }

  if (byMonth.length >= 2) {
    const last = byMonth.at(-1)!;
    const prev = byMonth.at(-2)!;
    if (prev.spend > 0) {
      const delta = (last.spend - prev.spend) / prev.spend;
      insights.push({
        id: "mom",
        title: `${last.label} vs ${prev.label}`,
        detail:
          delta >= 0
            ? `Spending rose ${Math.round(delta * 100)}% month over month (${money(last.spend, currency)} vs ${money(prev.spend, currency)}).`
            : `Spending fell ${Math.round(Math.abs(delta) * 100)}% month over month (${money(last.spend, currency)} vs ${money(prev.spend, currency)}).`,
        tone: delta > 0.15 ? "watch" : delta < -0.1 ? "positive" : "neutral",
      });
    }
  }

  if (recurring.length) {
    const monthly = recurring.reduce((sum, r) => sum + r.monthlyEstimate, 0);
    insights.push({
      id: "recurring",
      title: `${recurring.length} recurring charges`,
      detail: `About ${money(monthly, currency)} lands every month on subscriptions, memberships, and utilities.`,
      tone: "neutral",
    });
  }

  if (refunds > 0 || credits > 0 || reversals > 0) {
    const parts = [];
    if (refunds > 0) parts.push(`${money(refunds, currency)} in merchant refunds`);
    if (credits > 0) parts.push(`${money(credits, currency)} in temporary credits`);
    if (reversals > 0) parts.push(`${money(reversals, currency)} later reversed`);
    insights.push({
      id: "returns",
      title: "Refunds and credits",
      detail: `${parts.join(", ")}. They are listed separately so they do not inflate spend or card payments.`,
      tone: refunds > 0 ? "positive" : "neutral",
    });
  }

  if (largestPurchase) {
    insights.push({
      id: "largest",
      title: "Largest purchase",
      detail: `${largestPurchase.merchant} · ${money(largestPurchase.amount, currency)} on ${largestPurchase.date}.`,
      tone: largestPurchase.amount > 400 ? "watch" : "neutral",
    });
  }

  const paidInFull = statements.filter((s) => {
    if (s.previousBalance == null || s.payments == null) return false;
    return Math.abs(Math.abs(s.payments) - s.previousBalance) < 1;
  }).length;
  if (statements.length) {
    insights.push({
      id: "payoff",
      title: "Statement payoff habit",
      detail: `${paidInFull} of ${statements.length} statements show the previous balance paid in full.`,
      tone: paidInFull === statements.length ? "positive" : paidInFull / statements.length < 0.5 ? "watch" : "neutral",
    });
  }

  if (merchants[0]) {
    insights.push({
      id: "top-merchant",
      title: `${merchants[0].merchant} is the top merchant`,
      detail: `${merchants[0].count} charges totaling ${money(merchants[0].spend, currency)}.`,
      tone: "neutral",
    });
  }

  const dining = byCategory.find((c) => c.category === "Dining");
  if (dining && dining.share > 0.18) {
    insights.push({
      id: "dining",
      title: "Dining is a habit, not a treat",
      detail: `Restaurants and coffee are ${Math.round(dining.share * 100)}% of spend. Worth a closer look if you are trying to save.`,
      tone: "watch",
    });
  }

  const fuel = byCategory.find((c) => c.category === "Fuel");
  if (fuel && fuel.share > 0.08) {
    insights.push({
      id: "fuel",
      title: "Fuel is a steady line item",
      detail: `ADNOC and other fuel stops are ${Math.round(fuel.share * 100)}% of spend — ${money(fuel.spend, currency)}.`,
      tone: "neutral",
    });
  }

  const city = byCity.find((row) => row.city !== "Unspecified");
  if (city) {
    insights.push({
      id: "city",
      title: `${city.city} is the home market`,
      detail: `${city.count} purchases and ${money(city.spend, currency)} posted there.`,
      tone: "neutral",
    });
  }

  const travelMonths = byMonth.filter((m) => {
    const monthPurchases = purchases.filter((t) => t.date.startsWith(m.month) && t.category === "Travel");
    return monthPurchases.reduce((s, t) => s + t.amount, 0) > 2000;
  });
  if (travelMonths.length && travelMonths.length <= 3) {
    insights.push({
      id: "travel",
      title: "Travel months stand out",
      detail: `${travelMonths.map((m) => m.label).join(", ")} include sizable car rental or trip charges.`,
      tone: "neutral",
    });
  }

  return insights.slice(0, 8);
}
