# Fathom

Local credit card statement intelligence. Drop PDFs into `statements/`, run the app, and read spending as widgets.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add statement PDFs to `statements/` and click **Rescan folder**.

Optional US-style samples: `npm run generate-statements`.

The parser is tuned for Emirates Islamic card statements (`10 JAN 09 JAN MERCHANT CITY ARE 12.34`, payments ending in `CR`) and also accepts generic `MM/DD/YYYY  DESCRIPTION  12.34` lines. Image-only scans will not parse.
