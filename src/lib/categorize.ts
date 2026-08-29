import type { Category, TransactionType } from "@/lib/types";

const RULES: Array<{ category: Category; pattern: RegExp }> = [
  { category: "Payments", pattern: /\b(payment|thank you|autopay|online pmt|transfer payment)\b/i },
  { category: "Fees", pattern: /\b(cash advance fee|vat on cash|billed profit|late payment|over limit|finance charge)\b/i },
  { category: "Insurance", pattern: /\b(credit shield|vat on insurance|geico|insurance)\b/i },
  { category: "Fuel", pattern: /\b(adnoc|enoc|eppco|emarat|petrol|gas station)\b/i },
  {
    category: "Subscriptions",
    pattern: /\b(netflix|spotify|hulu|disney\+|apple\.com\/bill|icloud|prime|nyt digital|youtube premium|reelshort)\b/i,
  },
  {
    category: "Groceries",
    pattern:
      /\b(lulu|carrefour|madang|baqala|viva\b|day to day|unimart|fresh and fine|safa express|whole foods|trader joe|costco|supermarket|hypermarket|grocery|spar express|spinneys|waitrose|west zone)/i,
  },
  {
    category: "Dining",
    pattern:
      /\b(starbucks|kfc|pizza hut|sweetgreen|chipotle|restaurant|burger|cafe|cafeteria|keeta|bikanervala|aroma|biriyani|shakespeare|just burger|slash burger|golden jumana|krispy kreme|tandoori|himalayan|dhaba)\b/i,
  },
  {
    category: "Travel",
    pattern: /\b(selfdrive|budget rent|rent a car|united|delta|jetblue|airbnb|marriott|hilton|hotel|airlines|amtrak)\b/i,
  },
  { category: "Transit", pattern: /\b(arabia taxi|uber|lyft|careem|taxi|mta|salik|car park)\b/i },
  {
    category: "Shopping",
    pattern:
      /\b(amazon|ikea|zara|h and m|stradivarius|adidas|sephora|pandora|temu|home cent(?:re|er)|victoria|yesstyle|max\b|landmark|off price|grand gifts|furniture|furnitur|bloomingdale|target|apple store|mall mart|marina mall|deslo|fashions?|outlet|carpet|lighting|home box|danube|shobra|1004 mart|brands for less|alshaya|lifestyle|home building|dates|pan emirates|al futtaim)/i,
  },
  { category: "Health", pattern: /\b(cvs|pharmacy|medical|hospital|one medical|enfield royal|phy br)\b/i },
  { category: "Auto", pattern: /\b(auto kings|garage|q mobility)\b/i },
  { category: "Utilities", pattern: /\b(etisalat|du\b|comcast|xfinity|verizon)\b/i },
  { category: "Entertainment", pattern: /\b(amc|netflix|spotify|ticketmaster|cinema|star cinemas)\b/i },
];

const CITIES = [
  "ABU DHABI",
  "ABUDHABI",
  "DUBAI",
  "DUABI",
  "SHARJAH",
  "AJMAN",
  "AL AIN",
  "RAK",
  "FUJAIRAH",
  "CORK",
  "DUBLIN",
  "MOUNTAIN VIEW",
  "CALGARY",
];

export function categorize(description: string): Category {
  for (const rule of RULES) {
    if (rule.pattern.test(description)) return rule.category;
  }
  return "Other";
}

export function classifyType(description: string, amount: number): TransactionType {
  const text = description.toLowerCase();
  if (/\b(billed profit|interest|finance charge)\b/.test(text)) return "interest";
  if (/\b(fee|late payment|overlimit|over limit|vat on cash)\b/.test(text)) return "fee";
  if (/\b(transfer payment|payment thank you|thank you|autopay)\b/.test(text)) return "payment";
  if (/\b(rvsl|reversal of ex|reversal of credit)\b/.test(text)) return "reversal";
  if (/\btemp credit\b/.test(text)) return "credit";
  if (amount < 0) return "refund";
  return "purchase";
}

export function extractCity(description: string): string | null {
  const upper = description.toUpperCase();
  for (const city of CITIES) {
    if (upper.includes(city)) {
      if (city === "ABUDHABI" || city === "ABU DHABI") return "Abu Dhabi";
      if (city === "DUABI") return "Dubai";
      return city
        .toLowerCase()
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
  return null;
}

export function merchantName(description: string): string {
  const cleaned = description
    .replace(/\b(ABU DHABI|ABUDHABI|DUBAI|DUABI|SHARJAH|AJMAN|ARE|USA|IRL|GBR|CORK|DUBLIN 2|MOUNTAIN VIEW)\b/gi, "")
    .replace(/\s+#\d+\b/g, "")
    .replace(/\bT-\d+\b/g, "")
    .replace(/\*{1,2}/g, " ")
    .replace(/\b\d{6,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const aliases: Array<[RegExp, string]> = [
    [/adnoc/i, "ADNOC"],
    [/lulu/i, "Lulu Hypermarket"],
    [/spinneys/i, "Spinneys"],
    [/mt\s*8848/i, "MT 8848 Restaurant"],
    [/budget rent/i, "Budget Rent A Car"],
    [/auto kings/i, "Auto Kings"],
    [/tamm\b/i, "TAMM"],
    [/three star fashions/i, "Three Star Fashions"],
    [/radiant enterprises/i, "Radiant Enterprises"],
    [/carrefour/i, "Carrefour"],
    [/madang/i, "Madang Supermarket"],
    [/ikea/i, "IKEA"],
    [/starbucks/i, "Starbucks"],
    [/amazon now/i, "Amazon Now"],
    [/amazon/i, "Amazon"],
    [/selfdrive/i, "Selfdrive"],
    [/credit shield/i, "Credit Shield"],
    [/rvsl of ex credit|reversal of ex/i, "Credit reversal"],
    [/transfer payment/i, "Card Payment"],
    [/temp credit/i, "Temporary credit"],
    [/kfc/i, "KFC"],
    [/zara/i, "Zara"],
    [/sephora/i, "Sephora"],
    [/keeta/i, "Keeta"],
    [/etisalat/i, "Etisalat"],
    [/apple\.com\/bill/i, "Apple"],
    [/temu/i, "Temu"],
    [/grand gifts/i, "Grand Gifts"],
    [/home centre/i, "Home Centre"],
    [/arabia taxi/i, "Arabia Taxi"],
    [/pizza hut/i, "Pizza Hut"],
    [/h and m|h&m/i, "H&M"],
    [/payment thank you/i, "Card Payment"],
  ];

  for (const [pattern, name] of aliases) {
    if (pattern.test(cleaned)) return name;
  }

  return cleaned
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
