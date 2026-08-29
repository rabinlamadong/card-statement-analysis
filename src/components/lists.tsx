import { formatDate, formatMoney } from "@/lib/format";
import type { DashboardData, Insight } from "@/lib/types";

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Insights</h2>
      <p className="mt-1 text-xs text-muted">What the statements are saying</p>
      <ul className="mt-4 space-y-3">
        {insights.map((insight) => (
          <li key={insight.id} className="rounded-2xl bg-canvas/70 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${toneDot(insight.tone)}`} />
              <p className="text-sm font-medium text-ink">{insight.title}</p>
            </div>
            <p className="mt-1 text-sm leading-5 text-muted">{insight.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MerchantList({
  merchants,
  currency,
}: {
  merchants: DashboardData["merchants"];
  currency: string;
}) {
  const top = merchants.slice(0, 8);
  const max = top[0]?.spend ?? 1;
  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Top merchants</h2>
      <p className="mt-1 text-xs text-muted">Where charges concentrate</p>
      <ul className="mt-4 space-y-3">
        {top.map((row) => (
          <li key={row.merchant}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{row.merchant}</span>
              <span className="tabular text-muted">{formatMoney(row.spend, currency)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${Math.max(8, (row.spend / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {row.count} charges · {row.category}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecurringList({
  recurring,
  currency,
}: {
  recurring: DashboardData["recurring"];
  currency: string;
}) {
  const monthly = recurring.reduce((sum, row) => sum + row.monthlyEstimate, 0);
  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Recurring</h2>
      <p className="mt-1 text-xs text-muted">
        {recurring.length} detected · {formatMoney(monthly, currency)} / month
      </p>
      <ul className="mt-4 divide-y divide-line">
        {recurring.map((row) => (
          <li key={row.merchant} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{row.merchant}</p>
              <p className="text-[11px] text-muted">
                {row.occurrences}× · last {formatDate(row.lastDate)} · {row.category}
              </p>
            </div>
            <p className="tabular text-sm">{formatMoney(row.typicalAmount, currency)}</p>
          </li>
        ))}
        {recurring.length === 0 && (
          <li className="py-6 text-sm text-muted">No stable recurring charges yet.</li>
        )}
      </ul>
    </section>
  );
}

const ADJUSTMENT_LABEL: Record<string, string> = {
  refund: "Merchant refund",
  credit: "Temporary credit",
  reversal: "Credit reversed",
};

export function AdjustmentsPanel({
  adjustments,
  currency,
}: {
  adjustments: DashboardData["adjustments"];
  currency: string;
}) {
  const refunds = adjustments.filter((row) => row.type === "refund");
  const credits = adjustments.filter((row) => row.type === "credit");
  const reversals = adjustments.filter((row) => row.type === "reversal");
  const refundTotal = refunds.reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const creditTotal = credits.reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const reversalTotal = reversals.reduce((sum, row) => sum + Math.abs(row.amount), 0);

  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Refunds & credits</h2>
      <p className="mt-1 text-xs text-muted">
        Merchant returns, temporary credits, and bank clawbacks — not card payments
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-teal-soft/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Refunds</p>
          <p className="tabular mt-1 text-lg">{formatMoney(refundTotal, currency)}</p>
          <p className="text-[11px] text-muted">{refunds.length} lines</p>
        </div>
        <div className="rounded-2xl bg-canvas px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Temp credits</p>
          <p className="tabular mt-1 text-lg">{formatMoney(creditTotal, currency)}</p>
          <p className="text-[11px] text-muted">{credits.length} holds released</p>
        </div>
        <div className="rounded-2xl bg-canvas px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Reversed</p>
          <p className="tabular mt-1 text-lg">{formatMoney(reversalTotal, currency)}</p>
          <p className="text-[11px] text-muted">{reversals.length} clawed back</p>
        </div>
      </div>
      <ul className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
        {adjustments.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-3 rounded-2xl bg-canvas/70 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{row.merchant}</p>
              <p className="text-[11px] text-muted">
                {ADJUSTMENT_LABEL[row.type] ?? row.type} · {formatDate(row.date)} · {row.description}
              </p>
            </div>
            <p className={`tabular shrink-0 text-sm ${row.amount < 0 ? "text-teal" : "text-rose"}`}>
              {row.amount < 0 ? "−" : "+"}
              {formatMoney(Math.abs(row.amount), currency)}
            </p>
          </li>
        ))}
        {adjustments.length === 0 && (
          <li className="py-6 text-sm text-muted">No refunds, temporary credits, or reversals in these statements.</li>
        )}
      </ul>
    </section>
  );
}

export function CityList({
  cities,
  currency,
}: {
  cities: DashboardData["byCity"];
  currency: string;
}) {
  const top = cities.slice(0, 6);
  const max = top[0]?.spend ?? 1;
  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Cities</h2>
      <p className="mt-1 text-xs text-muted">Where charges posted</p>
      <ul className="mt-4 space-y-3">
        {top.map((row) => (
          <li key={row.city}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{row.city}</span>
              <span className="tabular text-muted">{formatMoney(row.spend, currency)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
              <div
                className="h-full rounded-full bg-amber"
                style={{ width: `${Math.max(8, (row.spend / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">{row.count} charges</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatementFiles({
  statements,
  byCard,
  currency,
}: {
  statements: DashboardData["statements"];
  byCard: DashboardData["byCard"];
  currency: string;
}) {
  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <h2 className="font-display text-2xl text-ink">Loaded files</h2>
      <p className="mt-1 text-xs text-muted">From the statements folder</p>

      <div className="mt-4 space-y-2">
        {byCard.map((card) => (
          <div key={`${card.cardName}-${card.last4}`} className="rounded-2xl bg-teal-soft/60 px-3 py-2">
            <p className="text-sm font-medium">{card.cardName}</p>
            <p className="text-[11px] text-muted">
              •••• {card.last4} · {card.count} purchases · {formatMoney(card.spend, currency)}
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-4 max-h-[28rem] space-y-2 overflow-auto pr-1">
        {statements.map((statement) => (
          <li key={statement.id} className="rounded-2xl border border-line/80 px-3 py-2.5">
            <p className="truncate text-sm font-medium">{statement.fileName}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">
              {statement.periodStart ?? "?"} → {statement.periodEnd ?? "?"}
              <br />
              {statement.transactions.length} lines · {statement.pageCount}p
              {statement.newBalance != null ? ` · bal ${formatMoney(statement.newBalance, currency)}` : ""}
            </p>
            {statement.parseWarnings.map((warning) => (
              <p key={warning} className="mt-1 text-[11px] text-rose">
                {warning}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

function toneDot(tone: Insight["tone"]): string {
  if (tone === "positive") return "bg-moss";
  if (tone === "watch") return "bg-amber";
  return "bg-teal";
}
