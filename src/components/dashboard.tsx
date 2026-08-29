"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, RefreshCw } from "lucide-react";
import { CategoryChart, SpendChart } from "@/components/charts";
import {
  AdjustmentsPanel,
  CityList,
  InsightsPanel,
  MerchantList,
  RecurringList,
  StatementFiles,
} from "@/components/lists";
import { KpiStrip } from "@/components/kpi-cards";
import { TransactionTable } from "@/components/transaction-table";
import { formatDate } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function Dashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [card, setCard] = useState("all");
  const [kind, setKind] = useState("all");

  const cards = useMemo(
    () => data.byCard.map((card) => [card.last4, card.cardName] as const),
    [data.byCard],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions.filter((txn) => {
      if (category !== "all" && txn.category !== category) return false;
      if (card !== "all" && txn.cardLast4 !== card) return false;
      if (kind !== "all" && txn.type !== kind) return false;
      if (!q) return true;
      return (
        txn.description.toLowerCase().includes(q) ||
        txn.merchant.toLowerCase().includes(q) ||
        txn.category.toLowerCase().includes(q)
      );
    });
  }, [data.transactions, query, category, card, kind]);

  async function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  const empty = data.statements.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal">
            Local statement intelligence
          </p>
          <h1 className="font-display mt-2 text-5xl tracking-tight text-ink md:text-6xl">Fathom</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted">
            Reads every PDF in <span className="font-mono text-[13px] text-ink">statements/</span>,
            extracts the register, and turns it into a spending brief in{" "}
            {data.currency}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-line bg-paper px-3 py-2 text-xs text-muted">
            Scanned {formatDate(data.scannedAt, "MMM d, h:mm a")}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-teal"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Rescan folder
          </button>
        </div>
      </header>

      {data.errors.length > 0 && (
        <div className="mb-6 rounded-2xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">
          {data.errors.map((error) => (
            <p key={`${error.fileName}-${error.message}`}>
              <span className="font-medium">{error.fileName}:</span> {error.message}
            </p>
          ))}
        </div>
      )}

      {empty ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          <KpiStrip data={data} />

          <div className="grid gap-5 lg:grid-cols-5">
            <section className="rounded-3xl border border-line bg-paper p-5 lg:col-span-3">
              <SectionLabel
                title="Spend over time"
                hint="Purchases only — payments sit in the thin comparison bars"
              />
              <SpendChart months={data.byMonth} currency={data.currency} />
            </section>
            <section className="rounded-3xl border border-line bg-paper p-5 lg:col-span-2">
              <SectionLabel title="Where it went" hint="Share of purchase volume" />
              <CategoryChart categories={data.byCategory} currency={data.currency} />
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <InsightsPanel insights={data.insights} />
            <AdjustmentsPanel adjustments={data.adjustments} currency={data.currency} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <MerchantList merchants={data.merchants} currency={data.currency} />
            <RecurringList recurring={data.recurring} currency={data.currency} />
            <CityList cities={data.byCity} currency={data.currency} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-3xl border border-line bg-paper p-5 lg:col-span-2">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <SectionLabel
                  title="Register"
                  hint={`${filtered.length} of ${data.transactions.length} lines`}
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search merchant or memo"
                    className="h-9 w-48 rounded-full border border-line bg-canvas/60 px-3 text-sm outline-none ring-teal/30 placeholder:text-muted/70 focus:ring-2"
                  />
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value)}
                    className="h-9 rounded-full border border-line bg-canvas/60 px-3 text-sm outline-none"
                  >
                    <option value="all">All types</option>
                    <option value="purchase">Purchases</option>
                    <option value="payment">Card payments</option>
                    <option value="refund">Refunds</option>
                    <option value="credit">Temp credits</option>
                    <option value="reversal">Reversals</option>
                    <option value="fee">Fees</option>
                  </select>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-9 rounded-full border border-line bg-canvas/60 px-3 text-sm outline-none"
                  >
                    <option value="all">All categories</option>
                    {data.byCategory.map((row) => (
                      <option key={row.category} value={row.category}>
                        {row.category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card}
                    onChange={(event) => setCard(event.target.value)}
                    className="h-9 rounded-full border border-line bg-canvas/60 px-3 text-sm outline-none"
                  >
                    <option value="all">All cards</option>
                    {cards.map(([last4, name]) => (
                      <option key={last4} value={last4}>
                        {name} · {last4}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <TransactionTable transactions={filtered} currency={data.currency} />
            </section>
            <StatementFiles
              statements={data.statements}
              byCard={data.byCard}
              currency={data.currency}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-1">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-line bg-paper px-8 py-16 text-center">
      <FolderOpen className="mx-auto h-8 w-8 text-teal" />
      <h2 className="font-display mt-4 text-3xl">No statements yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
        Drop credit card PDFs into the <span className="font-mono text-ink">statements/</span> folder
        and press rescan. Sample files can be generated with{" "}
        <span className="font-mono text-ink">npm run generate-statements</span>.
      </p>
    </section>
  );
}
