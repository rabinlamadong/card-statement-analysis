import { format, parseISO } from "date-fns";

export function formatMoney(
  value: number,
  currency = "AED",
  opts?: { sign?: "auto" | "never" | "always" },
): string {
  const sign = opts?.sign ?? "auto";
  const abs = Math.abs(value);
  const body = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  if (sign === "never") return body;
  if (sign === "always") return value < 0 ? `−${body}` : `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

export function formatCompact(value: number, currency = "AED"): string {
  const abs = Math.abs(value);
  const prefix = value < 0 ? "−" : "";
  if (abs >= 1000) {
    const digits = abs >= 10000 ? 0 : 1;
    return `${prefix}${currency} ${(abs / 1000).toFixed(digits)}k`;
  }
  return `${prefix}${formatMoney(abs, currency, { sign: "never" })}`;
}

export function formatDate(iso: string, pattern = "MMM d"): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function monthLabel(yyyyMm: string): string {
  try {
    return format(parseISO(`${yyyyMm}-01`), "MMM yyyy");
  } catch {
    return yyyyMm;
  }
}
