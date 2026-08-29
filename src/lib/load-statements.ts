import { readdir } from "node:fs/promises";
import path from "node:path";
import { analyze } from "@/lib/analyze";
import { extractPdf } from "@/lib/extract-pdf";
import { parseStatementText } from "@/lib/parse-statement";
import type { DashboardData, Statement } from "@/lib/types";

export function statementsDirectory(): string {
  return path.join(process.cwd(), "statements");
}

export async function loadDashboardData(): Promise<DashboardData> {
  const dir = statementsDirectory();
  const errors: DashboardData["errors"] = [];
  let files: string[] = [];

  try {
    files = (await readdir(dir))
      .filter((name) => name.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return emptyDashboard(dir, [
      {
        fileName: "statements/",
        message: "Could not read the statements folder. Create it in the project root and add PDFs.",
      },
    ]);
  }

  const statements: Statement[] = [];
  for (const fileName of files) {
    try {
      const extracted = await extractPdf(path.join(dir, fileName));
      statements.push(
        parseStatementText({
          fileName,
          text: extracted.text,
          pageCount: extracted.pageCount,
          lines: extracted.lines,
        }),
      );
    } catch (error) {
      errors.push({
        fileName,
        message: error instanceof Error ? error.message : "Failed to parse PDF",
      });
    }
  }

  const analyzed = analyze(statements);
  return {
    ...analyzed,
    statementsDir: dir,
    errors,
  };
}

function emptyDashboard(dir: string, errors: DashboardData["errors"]): DashboardData {
  return {
    scannedAt: new Date().toISOString(),
    statementsDir: dir,
    currency: "AED",
    statements: [],
    transactions: [],
    insights: [],
    merchants: [],
    recurring: [],
    byCity: [],
    adjustments: [],
    totals: {
      spend: 0,
      payments: 0,
      refunds: 0,
      credits: 0,
      reversals: 0,
      transactionCount: 0,
      purchaseCount: 0,
      averageMonthlySpend: 0,
      largestPurchase: null,
      statementCount: 0,
      cardCount: 0,
      monthCount: 0,
    },
    byMonth: [],
    byCategory: [],
    byCard: [],
    errors,
  };
}
