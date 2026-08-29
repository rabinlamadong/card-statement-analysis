import { readFile } from "node:fs/promises";
import { getDocumentProxy } from "unpdf";

export type PdfLine = {
  page: number;
  y: number;
  text: string;
};

export type ExtractedPdf = {
  pageCount: number;
  text: string;
  lines: PdfLine[];
};

type TextItem = {
  str?: string;
  transform?: number[];
};

export async function extractPdf(filePath: string): Promise<ExtractedPdf> {
  const buffer = await readFile(filePath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const pageCount = pdf.numPages;
  const lines: PdfLine[] = [];
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; str: string }>>();

    for (const raw of content.items as TextItem[]) {
      const value = raw.str?.replace(/\u00a0/g, " ") ?? "";
      if (!value.trim() || !raw.transform) continue;
      const x = raw.transform[4];
      const y = Math.round(raw.transform[5] * 2) / 2;
      const row = rows.get(y) ?? [];
      if (row.some((part) => Math.abs(part.x - x) < 0.6 && part.str === value)) {
        continue;
      }
      row.push({ x, str: value });
      rows.set(y, row);
    }

    const pageLines = [...rows.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([y, parts]) => ({
        page: pageNumber,
        y,
        text: parts
          .sort((left, right) => left.x - right.x)
          .map((part) => part.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      }))
      .filter((line) => line.text.length > 0);

    lines.push(...pageLines);
    pageTexts.push(pageLines.map((line) => line.text).join("\n"));
  }

  return {
    pageCount,
    text: pageTexts.join("\n"),
    lines,
  };
}
