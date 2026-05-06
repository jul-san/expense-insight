<div align="center">
  <img src="expense-insight-banner.png" alt="expense insight banner" width="600"/>
  <p><em>shoutout to "image generator" by naif alotaibi on DALL·E for generating this image 🙏</em></p>
</div>

# Expense Insight

**Expense Insight** is a browser-based tool for visualizing Truist bank statement data. Upload one or more PDF statements and instantly see spending by category, account balance over time, and a full transaction breakdown which is all processed locally with no data ever leaving your browser!

## Features

- **Spending Donut** — cash flow breakdown by category (Purchases, Recurring, Investments, Deposits, Misc) with percentages and totals
- **Balance Chart** — account balance over time as a line or bar chart
- **Spending Table** — per-statement summary with cash flow totals across all periods
- **Transaction Details** — full transaction list grouped by category and statement period
- **Multi-statement** — upload multiple statements at once; entries are deduplicated and sorted by date
- **Privacy** — all PDF parsing happens in the browser via PDF.js; nothing is uploaded or stored

## Synthetic data

Included is a folder (synthetic_statements) with a set of synthetic Truist-style PDF statements for feature testing.

## Getting Started

```bash
git clone https://github.com/juliansanchez/expense-insight.git
cd expense-insight
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
