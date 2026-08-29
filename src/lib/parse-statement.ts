import { createHash } from "node:crypto";
import { categorize, classifyType, extractCity, merchantName } from "@/lib/categorize";
import type { PdfLine } from "@/lib/extract-pdf";
import { reconcileTransactions } from "@/lib/reconcile-statement";
import type { Statement, Transaction } from "@/lib/types";

const MONTHS: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const MONEY = "(-?\\$?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2}))";
const SLASH_DATE = "(\\d{1,2}[\\/\\-]\\d{1,2}(?:[\\/\\-]\\d{2,4})?)";
const EI_TXN =
  /^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(.+)$/i;

function hashId(...parts: string[]): string {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
}

function parseMoney(raw: string): number {
  const negative = /[-()]/.test(raw) || /CR/i.test(raw);
  const digits = raw.replace(/[^0-9.]/g, "");
  const value = Number(digits);
  if (Number.isNaN(value)) return 0;
  return negative ? -value : value;
}

function periodFromFileName(fileName: string): { start: string; end: string } | null {
  const match = fileName.match(/(20\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${match[1]}-${match[2]}-01`,
    end: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, "0")}`,
  };
}

function yearFromFileName(fileName: string): number | null {
  const match = fileName.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function toIsoFromParts(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseOrdinalDate(raw: string): string | null {
  const match = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const month = MONTHS[match[2].slice(0, 3).toUpperCase()];
  if (!month) return null;
  return toIsoFromParts(Number(match[1]), month, Number(match[3]));
}

function parseSlashDate(raw: string, fallbackYear?: number): string | null {
  const cleaned = raw.replace(/-/g, "/").trim();
  const parts = cleaned.split("/").map((part) => Number(part));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  let month = parts[0];
  let day = parts[1];
  let year = parts[2] ?? fallbackYear ?? new Date().getFullYear();
  if (parts[0] > 31) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (parts.length === 3 && parts[2] < 100) {
    day = parts[0];
    month = parts[1];
    year = parts[2];
  } else if (parts[0] > 12) {
    day = parts[0];
    month = parts[1];
  }
  if (year < 100) year += 2000;
  return toIsoFromParts(day, month, year);
}

function resolveYear(month: number, periodStart: string | null, periodEnd: string | null, fileYear: number | null): number {
  const endYear = periodEnd ? Number(periodEnd.slice(0, 4)) : fileYear ?? new Date().getFullYear();
  const startMonth = periodStart ? Number(periodStart.slice(5, 7)) : null;
  if (startMonth === 1 && month === 12) return endYear - 1;
  return endYear;
}

function normalizeLines(text: string): string[] {
  return text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractEmiratesMeta(text: string, fileName: string) {
  const lines = normalizeLines(text);
  const ordinals = lines
    .filter((line) => /^\d{1,2}(?:st|nd|rd|th)\s+[A-Za-z]+\s+20\d{2}$/i.test(line))
    .map(parseOrdinalDate)
    .filter((value): value is string => Boolean(value));
  const uniqueOrdinals = [...new Set(ordinals)].sort();
  const fromFile = periodFromFileName(fileName);

  const footer = text.match(
    /(\d{1,3}(?:,\d{3})*\.\d{2})\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(\d{2}\/\d{2}\/\d{2})\s+(\d{1,3}(?:,\d{3})*\.\d{2})/,
  );
  const opening = text.match(/OPENING BALANCE\s+([\d,]+\.\d{2})/i);
  const last4Match =
    text.match(/(\d{4})\s+X{4}\s+X{4}\s+(\d{4})/i) ?? text.match(/PRIMARY CARD NO:\s*\S*?(\d{4})/i);
  const last4 = last4Match?.[2] ?? last4Match?.[1] ?? "0000";

  const fileYear = yearFromFileName(fileName);
  const periodStart = uniqueOrdinals[0] ?? fromFile?.start ?? null;
  const periodEnd = uniqueOrdinals[1] ?? uniqueOrdinals[0] ?? fromFile?.end ?? null;

  const emirates = /emirates islamic/i.test(text);
  return {
    issuer: emirates ? "Emirates Islamic" : /aether/i.test(text) ? "Aether Bank" : "Unknown issuer",
    cardName: emirates
      ? "Amazon World"
      : /aether reserve/i.test(text)
        ? "Aether Reserve Visa"
        : fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
    cardLast4: last4,
    periodStart,
    periodEnd,
    dueDate: footer ? parseSlashDate(footer[4], fileYear ?? undefined) : null,
    previousBalance: opening ? parseMoney(opening[1]) : null,
    creditLimit: footer ? parseMoney(footer[1]) : null,
    availableCredit: footer ? parseMoney(footer[2]) : null,
    minimumPayment: footer ? parseMoney(footer[3]) : null,
    newBalance: footer ? parseMoney(footer[5]) : null,
  };
}

function extractEmiratesTransactions(
  sourceLines: PdfLine[],
  statementId: string,
  fileName: string,
  cardName: string,
  defaultLast4: string,
  periodStart: string | null,
  periodEnd: string | null,
): Transaction[] {
  const fileYear = yearFromFileName(fileName);
  const parsed: Transaction[] = [];
  let currentLast4 = defaultLast4;
  let pendingFx: { date: string; description: string } | null = null;

  for (const source of sourceLines) {
    const line = source.text;
    const cardSwitch = line.match(/PRIMARY CARD NO:\s*\S*?(\d{4})\s*$/i);
    if (cardSwitch) {
      currentLast4 = cardSwitch[1];
      continue;
    }

    if (pendingFx && /^[\d,]+\.\d{2}$/.test(line)) {
      pushTxn({
        date: pendingFx.date,
        description: pendingFx.description,
        amount: parseMoney(line),
        last4: currentLast4,
        page: source.page,
        y: source.y,
      });
      pendingFx = null;
      continue;
    }
    if (/^\*\(1 AED/i.test(line)) continue;

    const match = line.match(EI_TXN);
    if (!match) continue;

    const txnMonth = MONTHS[match[4].toUpperCase()];
    const txnDay = Number(match[3]);
    const year = resolveYear(txnMonth, periodStart, periodEnd, fileYear);
    const date = toIsoFromParts(txnDay, txnMonth, year);
    if (!date) continue;

    const rest = match[5].trim();
    if (/\b\d+(?:,\d{3})*\.\d{2}\s+[A-Z]{3}$/.test(rest) && !/CR$/i.test(rest)) {
      pendingFx = { date, description: rest.replace(/\s+\d+(?:,\d{3})*\.\d{2}\s+[A-Z]{3}$/, "").trim() };
      continue;
    }

    const amountMatch = rest.match(/([\d,]+\.\d{2})(CR)?$/i);
    if (!amountMatch) continue;
    const amount = parseMoney(`${amountMatch[2] ?? ""}${amountMatch[1]}`);
    const description = rest.slice(0, amountMatch.index).replace(/\b(ARE|USA|IRL|GBR)\s*$/i, "").trim();
    if (description.length < 3) continue;

    pushTxn({
      date,
      description,
      amount,
      last4: currentLast4,
      page: source.page,
      y: source.y,
    });
  }

  function pushTxn(input: {
    date: string;
    description: string;
    amount: number;
    last4: string;
    page: number | null;
    y: number | null;
  }) {
    if (input.amount === 0) return;
    const type = classifyType(input.description, input.amount);
    const category =
      type === "payment" ? "Payments" : type === "fee" || type === "interest" ? "Fees" : categorize(input.description);
    parsed.push({
      id: "",
      date: input.date,
      description: input.description,
      amount: input.amount,
      category,
      type,
      merchant: merchantName(input.description),
      city: extractCity(input.description),
      sourceFile: fileName,
      statementId,
      cardLast4: input.last4,
      cardName,
      page: input.page,
      y: input.y,
    });
  }

  return parsed;
}

function extractGenericTransactions(
  text: string,
  statementId: string,
  fileName: string,
  cardLast4: string,
  cardName: string,
  fallbackYear?: number,
): Transaction[] {
  const lines = normalizeLines(text);
  const patterns = [
    new RegExp(`^${SLASH_DATE}\\s+(.+?)\\s+${MONEY}$`),
    new RegExp(`^${SLASH_DATE}\\s+${SLASH_DATE}\\s+(.+?)\\s+${MONEY}$`),
  ];
  const seen = new Set<string>();
  const transactions: Transaction[] = [];

  for (const line of lines) {
    if (/^(date|description|amount|transactions|account summary|page \d)/i.test(line)) continue;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match) continue;
      const dateRaw = match[1];
      const description = match[match.length - 2].replace(/\s{2,}/g, " ").trim();
      const amount = parseMoney(match[match.length - 1]);
      const date = parseSlashDate(dateRaw, fallbackYear);
      if (!date || description.length < 3 || amount === 0) continue;
      if (/^(previous balance|new balance|payments|purchases|credit limit)/i.test(description)) continue;
      const type = classifyType(description, amount);
      const id = hashId(fileName, date, description, amount.toFixed(2));
      if (seen.has(id)) continue;
      seen.add(id);
      transactions.push({
        id,
        date,
        description,
        amount,
        category: type === "payment" ? "Payments" : categorize(description),
        type,
        merchant: merchantName(description),
        city: extractCity(description),
        sourceFile: fileName,
        statementId,
        cardLast4,
        cardName,
        page: null,
        y: null,
      });
      break;
    }
  }
  return transactions;
}

export function parseStatementText(input: {
  fileName: string;
  text: string;
  pageCount: number;
  lines?: PdfLine[];
}): Statement {
  const text = input.text.replace(/\u00a0/g, " ");
  const statementId = hashId(input.fileName, String(input.pageCount), text.slice(0, 240));
  const emirates = /emirates islamic|PRIMARY CARD NO|OPENING BALANCE/i.test(text);
  const meta = extractEmiratesMeta(text, input.fileName);

  const genericPeriod = text.match(
    new RegExp(`Statement Period\\s*:?\\s*${SLASH_DATE}\\s*[-–—to]+\\s*${SLASH_DATE}`, "i"),
  );
  const longPeriod = text.match(
    /Statement Period\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*[-–—]\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  );

  let periodStart: string | null = meta.periodStart;
  let periodEnd: string | null = meta.periodEnd;
  if (!periodStart && genericPeriod) {
    periodStart = parseSlashDate(genericPeriod[1]);
    periodEnd = parseSlashDate(genericPeriod[2]);
  }
  if (!periodStart && longPeriod) {
    const start = new Date(longPeriod[1]);
    const end = new Date(longPeriod[2]);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      periodStart = start.toISOString().slice(0, 10);
      periodEnd = end.toISOString().slice(0, 10);
    }
  }

  const sourceLines: PdfLine[] =
    input.lines && input.lines.length > 0
      ? input.lines
      : normalizeLines(text).map((line) => ({ page: 0, y: 0, text: line }));

  const parsed = emirates
    ? extractEmiratesTransactions(
        sourceLines,
        statementId,
        input.fileName,
        meta.cardName,
        meta.cardLast4,
        periodStart,
        periodEnd,
      )
    : extractGenericTransactions(
        text,
        statementId,
        input.fileName,
        meta.cardLast4,
        meta.cardName,
        periodStart ? Number(periodStart.slice(0, 4)) : yearFromFileName(input.fileName) ?? undefined,
      );

  const reconciled = reconcileTransactions(parsed, meta.previousBalance, meta.newBalance);
  const transactions = reconciled.transactions
    .map((txn, index) => ({
      ...txn,
      id: hashId(
        input.fileName,
        txn.date,
        txn.description,
        txn.amount.toFixed(2),
        txn.cardLast4,
        String(txn.page ?? 0),
        String(txn.y ?? index),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));

  const purchaseTotal = transactions.filter((txn) => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0);
  const paymentTotal = transactions.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0);

  const warnings: string[] = [];
  if (transactions.length === 0) {
    warnings.push("No transaction lines matched. The PDF may be image-based or an unsupported layout.");
  }
  if (reconciled.dropped.length > 0) {
    warnings.push(
      `Removed ${reconciled.dropped.length} repeated row(s) so the register matches the statement opening and closing balance.`,
    );
  } else if (reconciled.residual != null && reconciled.residual !== 0) {
    warnings.push("Register does not match the stated opening/closing balance; no repeated row explained the gap.");
  }

  return {
    id: statementId,
    fileName: input.fileName,
    issuer: meta.issuer,
    cardName: meta.cardName,
    cardLast4: meta.cardLast4,
    periodStart,
    periodEnd,
    dueDate: meta.dueDate,
    previousBalance: meta.previousBalance,
    payments: paymentTotal === 0 ? null : paymentTotal,
    purchases: purchaseTotal === 0 ? null : Number(purchaseTotal.toFixed(2)),
    interestCharged: transactions
      .filter((txn) => txn.type === "interest")
      .reduce<number | null>((sum, txn) => (sum ?? 0) + txn.amount, null),
    newBalance: meta.newBalance,
    creditLimit: meta.creditLimit,
    minimumPayment: meta.minimumPayment,
    availableCredit: meta.availableCredit,
    pageCount: input.pageCount,
    transactions,
    parseWarnings: warnings,
    rawTextPreview: text.slice(0, 1200),
  };
}
