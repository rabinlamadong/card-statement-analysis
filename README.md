# Fathom

Local credit card statement dashboard. It reads PDFs from `statements/` and turns them into spend widgets.

## Start

You need Node 22+.

```bash
git clone git@github.com:rabinlamadong/card-statement-analysis.git
cd card-statement-analysis
npm install
```

Put your statement PDFs in the `statements/` folder at the project root. Filenames like `2026-01.pdf` work well.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). After you add or replace PDFs, click **Rescan folder**.

## What you can do

- Scan every `.pdf` in `statements/`
- See totals, categories, merchants, cities, refunds, and recurring charges
- Open **By month** for purchases, payments, and refunds per month
- Click a month (or use the month filter) to limit the register
- Sort the month table, register, merchants, and loaded files

## Notes

The parser is tuned for Emirates Islamic statements (`10 JAN 09 JAN MERCHANT CITY ARE 12.34`, credits ending in `CR`). Generic `MM/DD/YYYY  DESCRIPTION  12.34` lines also work. Image-only scans will not parse.

Statement PDFs stay on your machine. They are not committed to git.

Optional US-style samples:

```bash
npm run generate-statements
```
