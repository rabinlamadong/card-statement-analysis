import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";

const TYPE_LABEL: Record<TransactionType, string> = {
  purchase: "Purchase",
  payment: "Payment",
  refund: "Refund",
  credit: "Temp credit",
  reversal: "Reversed",
  fee: "Fee",
  interest: "Profit",
};

export function TransactionTable({
  transactions,
  currency,
}: {
  transactions: Transaction[];
  currency: string;
}) {
  return (
    <div className="max-h-[36rem] overflow-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-canvas/95 backdrop-blur">
          <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Merchant</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Card</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-t border-line/80 hover:bg-canvas/50">
              <td className="tabular whitespace-nowrap px-3 py-2 text-muted">
                {formatDate(txn.date, "MMM d, yyyy")}
              </td>
              <td className="px-3 py-2">
                <p className="font-medium">{txn.merchant}</p>
                <p className="max-w-[22rem] truncate text-[11px] text-muted">{txn.description}</p>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${typeTone(txn.type)}`}>
                  {TYPE_LABEL[txn.type]}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-muted">
                  {txn.category}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-[11px] text-muted">•••• {txn.cardLast4}</td>
              <td
                className={`tabular whitespace-nowrap px-3 py-2 text-right ${
                  txn.amount < 0 ? "text-teal" : "text-ink"
                }`}
              >
                {txn.amount < 0 ? "−" : ""}
                {formatMoney(Math.abs(txn.amount), currency)}
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted">
                No lines match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function typeTone(type: TransactionType): string {
  if (type === "refund" || type === "credit") return "bg-teal-soft text-teal";
  if (type === "payment") return "bg-canvas text-muted";
  if (type === "reversal" || type === "fee" || type === "interest") return "bg-rose/10 text-rose";
  return "bg-canvas text-muted";
}
