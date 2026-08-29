export const CATEGORIES = [
  "Groceries",
  "Dining",
  "Fuel",
  "Travel",
  "Shopping",
  "Subscriptions",
  "Transit",
  "Health",
  "Auto",
  "Utilities",
  "Entertainment",
  "Insurance",
  "Fees",
  "Payments",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TransactionType = "purchase" | "payment" | "refund" | "credit" | "reversal" | "fee" | "interest";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  merchant: string;
  city: string | null;
  sourceFile: string;
  statementId: string;
  cardLast4: string;
  cardName: string;
  page: number | null;
  y: number | null;
};

export type Statement = {
  id: string;
  fileName: string;
  issuer: string;
  cardName: string;
  cardLast4: string;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  previousBalance: number | null;
  payments: number | null;
  purchases: number | null;
  interestCharged: number | null;
  newBalance: number | null;
  creditLimit: number | null;
  minimumPayment: number | null;
  availableCredit: number | null;
  pageCount: number;
  transactions: Transaction[];
  parseWarnings: string[];
  rawTextPreview: string;
};

export type InsightTone = "neutral" | "positive" | "watch";

export type Insight = {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
};

export type MerchantRollup = {
  merchant: string;
  category: Category;
  spend: number;
  count: number;
};

export type RecurringCharge = {
  merchant: string;
  category: Category;
  typicalAmount: number;
  occurrences: number;
  lastDate: string;
  monthlyEstimate: number;
};

export type DashboardData = {
  scannedAt: string;
  statementsDir: string;
  currency: string;
  statements: Statement[];
  transactions: Transaction[];
  insights: Insight[];
  merchants: MerchantRollup[];
  recurring: RecurringCharge[];
  byCity: { city: string; spend: number; count: number }[];
  adjustments: Transaction[];
  totals: {
    spend: number;
    payments: number;
    refunds: number;
    credits: number;
    reversals: number;
    transactionCount: number;
    purchaseCount: number;
    averageMonthlySpend: number;
    largestPurchase: Transaction | null;
    statementCount: number;
    cardCount: number;
    monthCount: number;
  };
  byMonth: {
    month: string;
    label: string;
    spend: number;
    payments: number;
    refunds: number;
    purchaseCount: number;
    lineCount: number;
  }[];
  byCategory: { category: Category; spend: number; share: number }[];
  byCard: { cardName: string; last4: string; spend: number; count: number }[];
  errors: { fileName: string; message: string }[];
};
