"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { compareValues, nextSort, type SortDir } from "@/lib/sort";
import type { DashboardData } from "@/lib/types";

type SortKey = "month" | "spend" | "payments" | "refunds" | "purchaseCount" | "lineCount";

export function MonthTable({
  months,
  currency,
  selected,
  onSelect,
}: {
  months: DashboardData["byMonth"];
  currency: string;
  selected: string;
  onSelect: (month: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("month");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    return [...months].sort((left, right) => compareValues(left[sortKey], right[sortKey], sortDir));
  }, [months, sortKey, sortDir]);

  function onHeader(key: SortKey) {
    const next = nextSort(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  }

  return (
    <section className="rounded-3xl border border-line bg-paper p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">By month</h2>
          <p className="mt-1 text-xs text-muted">Click a row to filter the register to that month</p>
        </div>
        {selected !== "all" && (
          <button
            type="button"
            onClick={() => onSelect("all")}
            className="self-start rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-teal hover:text-teal"
          >
            Show all months
          </button>
        )}
      </div>
      <div className="overflow-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-canvas/95">
            <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <SortHead label="Month" active={sortKey === "month"} dir={sortDir} onClick={() => onHeader("month")} />
              <SortHead
                label="Purchases"
                active={sortKey === "spend"}
                dir={sortDir}
                align="right"
                onClick={() => onHeader("spend")}
              />
              <SortHead
                label="Payments"
                active={sortKey === "payments"}
                dir={sortDir}
                align="right"
                onClick={() => onHeader("payments")}
              />
              <SortHead
                label="Refunds"
                active={sortKey === "refunds"}
                dir={sortDir}
                align="right"
                onClick={() => onHeader("refunds")}
              />
              <SortHead
                label="Charges"
                active={sortKey === "purchaseCount"}
                dir={sortDir}
                align="right"
                onClick={() => onHeader("purchaseCount")}
              />
              <SortHead
                label="Lines"
                active={sortKey === "lineCount"}
                dir={sortDir}
                align="right"
                onClick={() => onHeader("lineCount")}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = selected === row.month;
              return (
                <tr
                  key={row.month}
                  className={`cursor-pointer border-t border-line/80 hover:bg-canvas/70 ${
                    active ? "bg-teal-soft/50" : ""
                  }`}
                  onClick={() => onSelect(active ? "all" : row.month)}
                >
                  <td className="px-3 py-2 font-medium">{row.label}</td>
                  <td className="tabular px-3 py-2 text-right">{formatMoney(row.spend, currency)}</td>
                  <td className="tabular px-3 py-2 text-right text-muted">
                    {formatMoney(row.payments, currency)}
                  </td>
                  <td className="tabular px-3 py-2 text-right text-teal">
                    {row.refunds > 0 ? formatMoney(row.refunds, currency) : "—"}
                  </td>
                  <td className="tabular px-3 py-2 text-right text-muted">{row.purchaseCount}</td>
                  <td className="tabular px-3 py-2 text-right text-muted">{row.lineCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SortHead({
  label,
  active,
  dir,
  align = "left",
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <th className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""} ${
          active ? "text-ink" : "text-muted"
        }`}
      >
        {label}
        <span className="text-[10px]">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}
