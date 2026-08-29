import { ArrowDownRight, CreditCard, Receipt, TrendingUp, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function KpiStrip({ data }: { data: DashboardData }) {
  const currency = data.currency;
  const utilization = [...data.statements]
    .reverse()
    .find((s) => s.creditLimit && s.newBalance != null && s.creditLimit > 0);
  const latestUtil =
    utilization?.creditLimit && utilization.newBalance != null
      ? utilization.newBalance / utilization.creditLimit
      : null;

  const items = [
    {
      label: "Total purchases",
      value: formatMoney(data.totals.spend, currency),
      hint: `${data.totals.purchaseCount} charges across ${data.totals.monthCount} months`,
      icon: TrendingUp,
    },
    {
      label: "Monthly average",
      value: formatMoney(data.totals.averageMonthlySpend, currency),
      hint: `${data.totals.cardCount} cards · ${data.totals.statementCount} statements`,
      icon: Wallet,
    },
    {
      label: "Card payments",
      value: formatMoney(data.totals.payments, currency),
      hint: `${data.adjustments.length} refunds/credits sit in their own list`,
      icon: ArrowDownRight,
    },
    {
      label: "Largest charge",
      value: data.totals.largestPurchase
        ? formatMoney(data.totals.largestPurchase.amount, currency)
        : "—",
      hint: data.totals.largestPurchase?.merchant ?? "No purchases parsed",
      icon: Receipt,
    },
    {
      label: "Latest utilization",
      value: latestUtil == null ? "—" : `${Math.round(latestUtil * 100)}%`,
      hint: utilization
        ? `${formatMoney(utilization.newBalance ?? 0, currency)} of ${formatMoney(utilization.creditLimit ?? 0, currency)}`
        : "Limit not found",
      icon: CreditCard,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="rounded-3xl border border-line bg-paper px-4 py-4 shadow-[0_1px_0_rgba(27,22,18,0.04)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {item.label}
              </p>
              <Icon className="h-3.5 w-3.5 text-teal" />
            </div>
            <p className="tabular mt-3 font-display text-[2rem] leading-none tracking-tight">
              {item.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
