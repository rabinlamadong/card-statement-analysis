"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const PALETTE = ["#0d6b60", "#b45309", "#9f2d2d", "#4d6b3c", "#1d4e89", "#7c4a1a", "#5b4b8a", "#875d3b"];

export function SpendChart({
  months,
  currency,
}: {
  months: DashboardData["byMonth"];
  currency: string;
}) {
  return (
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={months} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d6b60" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0d6b60" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e0d3bf" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#6d6256", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#6d6256", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              Number(value) >= 1000 ? `${Math.round(Number(value) / 100) / 10}k` : String(value)
            }
          />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="spend"
            name="Purchases"
            stroke="#0d6b60"
            strokeWidth={2.2}
            fill="url(#spendFill)"
          />
          <Bar dataKey="payments" name="Payments" fill="#c4b49a" radius={[4, 4, 0, 0]} barSize={10} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({
  categories,
  currency,
}: {
  categories: DashboardData["byCategory"];
  currency: string;
}) {
  const top = categories.slice(0, 7);
  return (
    <div className="mt-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={96}
              tick={{ fill: "#6d6256", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Bar dataKey="spend" name="Spend" radius={[0, 6, 6, 0]} barSize={12}>
              {top.map((row, index) => (
                <Cell key={row.category} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1.5">
        {top.slice(0, 5).map((row, index) => (
          <li key={row.category} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: PALETTE[index % PALETTE.length] }}
              />
              {row.category}
            </span>
            <span className="tabular text-ink">
              {formatMoney(row.spend, currency)} · {Math.round(row.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  currency = "AED",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-paper px-3 py-2 text-xs shadow-sm">
      {label ? <p className="mb-1 font-medium text-ink">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name} className="text-muted">
          <span style={{ color: item.color }}>{item.name}</span> {formatMoney(Number(item.value), currency)}
        </p>
      ))}
    </div>
  );
}
