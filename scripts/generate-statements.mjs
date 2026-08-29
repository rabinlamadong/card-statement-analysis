import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "statements");

const INK = rgb(0.11, 0.09, 0.07);
const MUTED = rgb(0.38, 0.34, 0.3);
const RULE = rgb(0.78, 0.72, 0.64);
const TEAL = rgb(0.05, 0.38, 0.34);
const PAPER = rgb(0.99, 0.97, 0.94);
const BAND = rgb(0.93, 0.89, 0.82);

/** @typedef {{ date: string, description: string, amount: number }} Txn */

/**
 * @param {string} ymd
 * @param {number} day
 */
function onDay(ymd, day) {
  const [y, m] = ymd.split("-").map(Number);
  return `${String(m).padStart(2, "0")}/${String(day).padStart(2, "0")}/${y}`;
}

/**
 * @param {string} startYmd
 * @param {string} cardKey
 * @returns {Txn[]}
 */
function buildTransactions(startYmd, cardKey) {
  const [year, month] = startYmd.split("-").map(Number);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const txns = [];

  if (cardKey === "aether") {
    const recurrings = [
      [4, "NETFLIX.COM", 15.49],
      [4, "SPOTIFY USA", 11.99],
      [6, "APPLE.COM/BILL", 9.99],
      [8, "AMAZON PRIME", 14.99],
      [11, "NYT DIGITAL", 17.0],
      [12, "PLANET FITNESS", 24.99],
      [15, "COMCAST XFINITY", 89.99],
      [18, "GEICO AUTO", 142.18],
    ];
    for (const [day, desc, amt] of recurrings) {
      txns.push({ date: onDay(startYmd, day), description: desc, amount: amt });
    }

    const groceries = {
      "2026-03": [
        [2, "WHOLE FOODS MKT #104", 86.42],
        [7, "TRADER JOE'S #548", 54.18],
        [14, "COSTCO WHSE #0214", 187.63],
        [21, "WHOLE FOODS MKT #104", 72.9],
        [28, "TRADER JOE'S #548", 41.25],
      ],
      "2026-04": [
        [3, "WHOLE FOODS MKT #104", 91.07],
        [9, "TRADER JOE'S #548", 48.6],
        [16, "COSTCO WHSE #0214", 204.12],
        [23, "WHOLE FOODS MKT #104", 67.44],
        [29, "TRADER JOE'S #548", 39.8],
      ],
      "2026-05": [
        [1, "WHOLE FOODS MKT #104", 79.33],
        [8, "TRADER JOE'S #548", 62.15],
        [15, "COSTCO WHSE #0214", 176.4],
        [22, "WHOLE FOODS MKT #104", 88.21],
        [30, "TRADER JOE'S #548", 45.9],
      ],
      "2026-06": [
        [5, "WHOLE FOODS MKT #104", 58.12],
        [12, "TRADER JOE'S #548", 36.4],
        [20, "COSTCO WHSE #0214", 142.77],
        [27, "WHOLE FOODS MKT #104", 61.08],
      ],
      "2026-07": [
        [2, "WHOLE FOODS MKT #104", 94.55],
        [10, "TRADER JOE'S #548", 51.22],
        [17, "COSTCO WHSE #0214", 219.8],
        [24, "WHOLE FOODS MKT #104", 73.16],
        [31, "TRADER JOE'S #548", 47.03],
      ],
      "2026-08": [
        [1, "WHOLE FOODS MKT #104", 82.14],
        [8, "TRADER JOE'S #548", 56.7],
        [14, "COSTCO WHSE #0214", 198.45],
        [22, "WHOLE FOODS MKT #104", 69.88],
      ],
    };

    const everyday = {
      "2026-03": [
        [3, "STARBUCKS STORE 4821", 7.45],
        [5, "UBER *TRIP", 18.62],
        [6, "SWEETGREEN UNION SQ", 16.84],
        [9, "AMAZON.COM*MK8Q2", 42.18],
        [10, "MTA*NYCT PAYGO", 2.9],
        [13, "CVS/PHARMACY #1104", 28.47],
        [16, "CHIPOTLE 0472", 14.32],
        [17, "UBER *TRIP", 22.1],
        [19, "TARGET T-2140", 67.93],
        [20, "AMC EMPIRE 25", 18.5],
        [24, "STARBUCKS STORE 4821", 6.85],
        [25, "ONE MEDICAL NYC", 49.0],
        [27, "AMAZON.COM*P91LA", 31.2],
        [29, "MTA*NYCT PAYGO", 2.9],
      ],
      "2026-04": [
        [1, "STARBUCKS STORE 4821", 6.95],
        [4, "UBER *TRIP", 15.4],
        [6, "SWEETGREEN UNION SQ", 18.1],
        [7, "AMAZON.COM*R4N11", 58.64],
        [10, "MTA*NYCT PAYGO", 2.9],
        [13, "CVS/PHARMACY #1104", 16.22],
        [14, "CHIPOTLE 0472", 13.88],
        [17, "TARGET T-2140", 44.19],
        [18, "UBER *TRIP", 27.55],
        [21, "BLOOMINGDALE'S 59TH", 128.0],
        [24, "STARBUCKS STORE 4821", 7.25],
        [26, "AMAZON.COM*T7K02", 24.99],
        [28, "MTA*NYCT PAYGO", 2.9],
      ],
      "2026-05": [
        [2, "STARBUCKS STORE 4821", 7.15],
        [4, "UBER *TRIP", 19.8],
        [7, "SWEETGREEN UNION SQ", 17.42],
        [9, "AMAZON.COM*W2P88", 86.4],
        [11, "MTA*NYCT PAYGO", 2.9],
        [13, "CVS/PHARMACY #1104", 34.18],
        [16, "CHIPOTLE 0472", 15.05],
        [19, "TARGET T-2140", 53.27],
        [20, "UBER *TRIP", 16.33],
        [23, "APPLE STORE SOHO", 129.0],
        [25, "STARBUCKS STORE 4821", 6.55],
        [27, "AMC EMPIRE 25", 21.0],
        [29, "AMAZON.COM*H55Q1", 19.47],
      ],
      "2026-06": [
        [2, "STARBUCKS STORE 4821", 7.05],
        [3, "UBER *TRIP", 21.44],
        [6, "SWEETGREEN UNION SQ", 15.9],
        [8, "AMAZON.COM*C0L92", 37.12],
        [11, "MTA*NYCT PAYGO", 2.9],
        [16, "CVS/PHARMACY #1104", 12.64],
        [18, "CHIPOTLE 0472", 14.77],
        [23, "TARGET T-2140", 38.5],
        [25, "STARBUCKS STORE 4821", 6.75],
        [28, "MTA*NYCT PAYGO", 2.9],
      ],
      "2026-07": [
        [3, "STARBUCKS STORE 4821", 7.35],
        [5, "UBER *TRIP", 24.18],
        [7, "SWEETGREEN UNION SQ", 19.22],
        [9, "AMAZON.COM*Z8M14", 72.33],
        [11, "MTA*NYCT PAYGO", 2.9],
        [14, "CVS/PHARMACY #1104", 41.8],
        [16, "CHIPOTLE 0472", 16.4],
        [18, "TARGET T-2140", 91.56],
        [20, "UBER *TRIP", 18.05],
        [22, "ONE MEDICAL NYC", 49.0],
        [25, "STARBUCKS STORE 4821", 6.95],
        [27, "AMC EMPIRE 25", 19.5],
        [29, "AMAZON.COM*Q1D77", 45.0],
        [30, "MTA*NYCT PAYGO", 2.9],
      ],
      "2026-08": [
        [2, "STARBUCKS STORE 4821", 7.55],
        [4, "UBER *TRIP", 17.92],
        [6, "SWEETGREEN UNION SQ", 16.2],
        [9, "AMAZON.COM*N6K30", 53.81],
        [11, "MTA*NYCT PAYGO", 2.9],
        [13, "CVS/PHARMACY #1104", 22.14],
        [15, "CHIPOTLE 0472", 14.95],
        [17, "TARGET T-2140", 48.62],
        [19, "UBER *TRIP", 20.4],
        [21, "STARBUCKS STORE 4821", 6.65],
        [24, "AMAZON.COM*B4T19", 28.99],
        [26, "MTA*NYCT PAYGO", 2.9],
        [27, "SWEETGREEN UNION SQ", 17.8],
      ],
    };

    for (const row of groceries[monthKey] ?? []) {
      txns.push({ date: onDay(startYmd, row[0]), description: row[1], amount: row[2] });
    }
    for (const row of everyday[monthKey] ?? []) {
      txns.push({ date: onDay(startYmd, row[0]), description: row[1], amount: row[2] });
    }
  }

  if (cardKey === "atlas") {
    const travel = {
      "2026-05": [
        [3, "UNITED 0162349281721", 428.4],
        [3, "UNITED 0162349281722", 428.4],
        [8, "AIRBNB * HOS 4KQ2", 612.0],
        [9, "THE HOXTON PORTLAND", 214.88],
        [10, "STUMPTOWN COFFEE", 8.5],
        [10, "CANARD PORTLAND", 86.2],
        [11, "UBER *TRIP", 24.15],
        [11, "POK POK PDX", 54.3],
        [12, "LYFT *RIDE", 18.4],
        [18, "SWEETGREEN UNION SQ", 17.1],
        [22, "GRAMERCY TAVERN", 164.8],
        [28, "MINETTA TAVERN", 142.0],
      ],
      "2026-06": [
        [4, "DELTA AIR 0062183341", 386.2],
        [5, "MARRIOTT MARQUIS ATL", 289.0],
        [5, "UBER *TRIP", 22.8],
        [6, "BACCHANALIA ATLANTA", 198.4],
        [14, "SWEETGREEN UNION SQ", 16.55],
        [19, "THE MODERN NYC", 187.25],
        [21, "UBER *TRIP", 19.6],
        [27, "CARBONE NYC", 246.0],
      ],
      "2026-07": [
        [2, "JETBLUE 2791844231", 198.4],
        [3, "THE STANDARD MIAMI", 342.0],
        [3, "UBER *TRIP", 28.9],
        [4, "JOE'S STONE CRAB", 176.5],
        [5, "LYFT *RIDE", 16.2],
        [11, "SWEETGREEN UNION SQ", 18.4],
        [16, "ATOMIX NYC", 312.0],
        [24, "LILIA BROOKLYN", 128.75],
        [26, "UBER *TRIP", 21.3],
      ],
      "2026-08": [
        [1, "AMTRAK *NYP", 148.0],
        [1, "THE LINE DC", 276.0],
        [2, "LE DIPLOMATE", 94.6],
        [2, "UBER *TRIP", 18.75],
        [8, "SWEETGREEN UNION SQ", 16.9],
        [14, "VIA CAROTA", 118.4],
        [20, "UBER *TRIP", 23.1],
        [22, "THE GRILL NYC", 156.8],
      ],
    };
    for (const row of travel[monthKey] ?? []) {
      txns.push({ date: onDay(startYmd, row[0]), description: row[1], amount: row[2] });
    }
  }

  txns.sort((a, b) => {
    const [am, ad, ay] = a.date.split("/").map(Number);
    const [bm, bd, by] = b.date.split("/").map(Number);
    return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
  });
  return txns;
}

const CARDS = [
  {
    key: "aether",
    filePrefix: "aether-reserve",
    issuer: "Aether Bank",
    cardName: "Aether Reserve Visa",
    last4: "4821",
    creditLimit: 15000,
    periods: [
      { start: "2026-03-01", end: "2026-03-31", due: "2026-04-22", opening: 2104.33 },
      { start: "2026-04-01", end: "2026-04-30", due: "2026-05-22", opening: null },
      { start: "2026-05-01", end: "2026-05-31", due: "2026-06-22", opening: null },
      { start: "2026-06-01", end: "2026-06-30", due: "2026-07-22", opening: null },
      { start: "2026-07-01", end: "2026-07-31", due: "2026-08-22", opening: null },
      { start: "2026-08-01", end: "2026-08-28", due: "2026-09-22", opening: null },
    ],
  },
  {
    key: "atlas",
    filePrefix: "atlas-travel",
    issuer: "Atlas Financial",
    cardName: "Atlas Travel American Express",
    last4: "7740",
    creditLimit: 25000,
    periods: [
      { start: "2026-05-01", end: "2026-05-31", due: "2026-06-18", opening: 0 },
      { start: "2026-06-01", end: "2026-06-30", due: "2026-07-18", opening: null },
      { start: "2026-07-01", end: "2026-07-31", due: "2026-08-18", opening: null },
      { start: "2026-08-01", end: "2026-08-28", due: "2026-09-18", opening: null },
    ],
  },
];

function money(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isoToLong(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isoToSlash(iso) {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/**
 * @param {object} card
 * @param {object} period
 * @param {number} previousBalance
 * @param {Txn[]} purchases
 */
async function renderStatement(card, period, previousBalance, purchases) {
  const paidInFull = previousBalance > 0;
  const paymentDay = card.key === "aether" ? 8 : 7;
  /** @type {Txn[]} */
  const register = [];
  if (paidInFull) {
    register.push({
      date: onDay(period.start, paymentDay),
      description: "PAYMENT THANK YOU",
      amount: -previousBalance,
    });
  }
  register.push(...purchases);
  register.sort((a, b) => {
    const [am, ad, ay] = a.date.split("/").map(Number);
    const [bm, bd, by] = b.date.split("/").map(Number);
    return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
  });

  const purchaseTotal = purchases.reduce((s, t) => s + t.amount, 0);
  const paymentTotal = paidInFull ? previousBalance : 0;
  const newBalance = Number((previousBalance - paymentTotal + purchaseTotal).toFixed(2));
  const minimumPayment = newBalance === 0 ? 0 : Math.max(35, Number((newBalance * 0.02).toFixed(2)));
  const available = Number((card.creditLimit - newBalance).toFixed(2));

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);

  const width = 612;
  const height = 792;
  const margin = 48;
  const rowsPerPage = 36;

  const pageCount = Math.max(1, 1 + Math.ceil(Math.max(0, register.length - 22) / rowsPerPage));
  const pages = Array.from({ length: pageCount }, () => {
    const page = doc.addPage([width, height]);
    page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER });
    return page;
  });

  const header = (page, pageIndex) => {
    page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: BAND });
    page.drawText(card.issuer.toUpperCase(), {
      x: margin,
      y: height - 36,
      size: 9,
      font: bold,
      color: TEAL,
    });
    page.drawText(card.cardName, {
      x: margin,
      y: height - 56,
      size: 16,
      font: bold,
      color: INK,
    });
    page.drawText(`Card ending ${card.last4}`, {
      x: margin,
      y: height - 74,
      size: 9,
      font: regular,
      color: MUTED,
    });
    const right = "ACCOUNT STATEMENT";
    const rw = bold.widthOfTextAtSize(right, 10);
    page.drawText(right, {
      x: width - margin - rw,
      y: height - 40,
      size: 10,
      font: bold,
      color: INK,
    });
    const pageLabel = `Page ${pageIndex + 1} of ${pageCount}`;
    const pw = regular.widthOfTextAtSize(pageLabel, 9);
    page.drawText(pageLabel, {
      x: width - margin - pw,
      y: height - 58,
      size: 9,
      font: regular,
      color: MUTED,
    });
    page.drawLine({
      start: { x: 0, y: height - 92 },
      end: { x: width, y: height - 92 },
      thickness: 1.25,
      color: TEAL,
    });
  };

  pages.forEach((page, i) => header(page, i));

  const first = pages[0];
  let y = height - 118;

  const meta = [
    ["Statement Period", `${isoToLong(period.start)} – ${isoToLong(period.end)}`],
    ["Payment Due Date", isoToLong(period.due)],
    ["Account Number", `XXXX-XXXX-XXXX-${card.last4}`],
  ];
  for (const [label, value] of meta) {
    first.drawText(`${label}:`, { x: margin, y, size: 9, font: bold, color: MUTED });
    first.drawText(value, { x: 168, y, size: 9, font: regular, color: INK });
    y -= 14;
  }

  y -= 10;
  first.drawText("ACCOUNT SUMMARY", {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: TEAL,
  });
  y -= 8;
  first.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.6,
    color: RULE,
  });
  y -= 18;

  const summary = [
    ["Previous Balance", previousBalance],
    ["Payments", -paymentTotal],
    ["Purchases", purchaseTotal],
    ["Interest Charged", 0],
    ["New Balance", newBalance],
    ["Minimum Payment Due", minimumPayment],
    ["Credit Limit", card.creditLimit],
    ["Available Credit", available],
  ];

  for (const [label, value] of summary) {
    first.drawText(`${label}:`, { x: margin, y, size: 9, font: regular, color: INK });
    const text = money(value);
    const tw = mono.widthOfTextAtSize(text, 10);
    first.drawText(text, {
      x: 280 - tw,
      y,
      size: 10,
      font: label === "New Balance" ? monoBold : mono,
      color: INK,
    });
    y -= 14;
  }

  y -= 16;
  first.drawText("TRANSACTIONS", {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: TEAL,
  });
  y -= 8;
  first.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.6,
    color: RULE,
  });
  y -= 16;

  const drawRowHeader = (page, rowY) => {
    page.drawText("Date", { x: margin, y: rowY, size: 8, font: bold, color: MUTED });
    page.drawText("Description", { x: 130, y: rowY, size: 8, font: bold, color: MUTED });
    const amt = "Amount";
    const aw = bold.widthOfTextAtSize(amt, 8);
    page.drawText(amt, { x: width - margin - aw, y: rowY, size: 8, font: bold, color: MUTED });
  };

  const drawTxn = (page, rowY, txn) => {
    page.drawText(txn.date, { x: margin, y: rowY, size: 9, font: mono, color: INK });
    const desc = txn.description.slice(0, 48);
    page.drawText(desc, { x: 130, y: rowY, size: 9, font: regular, color: INK });
    const amt = money(txn.amount);
    const aw = mono.widthOfTextAtSize(amt, 9);
    page.drawText(amt, {
      x: width - margin - aw,
      y: rowY,
      size: 9,
      font: mono,
      color: txn.amount < 0 ? TEAL : INK,
    });
  };

  drawRowHeader(first, y);
  y -= 14;

  let pageIndex = 0;
  let page = first;
  for (const txn of register) {
    if (y < 64) {
      pageIndex += 1;
      page = pages[pageIndex] ?? pages[pages.length - 1];
      y = height - 118;
      drawRowHeader(page, y);
      y -= 14;
    }
    drawTxn(page, y, txn);
    y -= 13;
  }

  const footerY = 36;
  for (const p of pages) {
    p.drawLine({
      start: { x: margin, y: 52 },
      end: { x: width - margin, y: 52 },
      thickness: 0.5,
      color: RULE,
    });
    p.drawText(
      `${card.issuer}  ·  Member FDIC  ·  This statement is a sample generated for local analysis.`,
      { x: margin, y: footerY, size: 7, font: regular, color: MUTED },
    );
  }

  const bytes = await doc.save();
  const stamp = period.start.slice(0, 7);
  const fileName = `${card.filePrefix}-${stamp}.pdf`;
  await writeFile(path.join(outDir, fileName), bytes);

  return {
    fileName,
    newBalance,
    purchases: register.filter((t) => t.amount > 0).length,
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const written = [];

  for (const card of CARDS) {
    let previous = card.periods[0].opening ?? 0;
    for (const period of card.periods) {
      const opening = period.opening ?? previous;
      const purchases = buildTransactions(period.start, card.key);
      const result = await renderStatement(card, period, opening, purchases);
      written.push(result);
      previous = result.newBalance;
    }
  }

  console.log(`Wrote ${written.length} statements to ${outDir}`);
  for (const row of written) {
    console.log(`  ${row.fileName}  (${row.purchases} purchases)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
