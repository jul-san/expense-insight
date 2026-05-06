import type { Statement, Transaction, TransactionGroups, CategoryKey } from '@/lib/types';
import { parseMoney, parseMMDDYYYY, monthLabel } from '@/lib/format';

// ── Public entry point ────────────────────────────────────────────────────────

export async function processFile(file: File): Promise<Statement> {
  const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const lines = isPDF
    ? await extractLinesFromPDF(file)
    : (await file.text()).split('\n');

  return {
    filename: file.name,
    ...extractBalances(lines),
    transactions: parseTransactions(lines),
  };
}

// ── PDF extraction ────────────────────────────────────────────────────────────

type RawTextItem = { str: string; transform: number[] };

async function extractLinesFromPDF(file: File): Promise<string[]> {
  // Dynamic import keeps pdfjs-dist out of the server bundle
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const result: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group text items by y-coordinate — items on the same visual line share the same y
    const byY = new Map<number, Array<{ x: number; text: string }>>();
    for (const item of content.items) {
      const ti = item as RawTextItem;
      if (!ti.str?.trim()) continue;
      const y = Math.round(ti.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x: ti.transform[4], text: ti.str });
    }

    // Sort rows top-to-bottom (PDF y-axis is bottom-up), items left-to-right
    [...byY.keys()]
      .sort((a, b) => b - a)
      .forEach(y => {
        const line = byY.get(y)!
          .sort((a, b) => a.x - b.x)
          .map(i => i.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (line) result.push(line);
      });
  }
  return result;
}

// ── Balance extraction ────────────────────────────────────────────────────────

type BalanceInfo = Pick<Statement,
  'openingDate' | 'openingBalance' | 'closingDate' | 'closingBalance' | 'label'
>;

function extractBalances(lines: string[]): BalanceInfo {
  let openingDate: Date | null     = null;
  let openingBalance: number | null = null;
  let closingDate: Date | null     = null;
  let closingBalance: number | null = null;

  for (const line of lines) {
    let m: RegExpMatchArray | null;

    // "Your previous balance as of 12/17/2025 $3,758.54"
    m = line.match(/your previous balance as of (\d{2}\/\d{2}\/\d{4})\s*\$?([\d,]+\.\d{2})/i);
    if (m && !openingDate) {
      openingDate    = parseMMDDYYYY(m[1]);
      openingBalance = parseMoney(m[2]);
    }

    // "Your new balance as of 01/21/2026 = $5,347.39"
    m = line.match(/your new balance as of (\d{2}\/\d{2}\/\d{4})\s*=?\s*\$?([\d,]+\.\d{2})/i);
    if (m && !closingDate) {
      closingDate    = parseMMDDYYYY(m[1]);
      closingBalance = parseMoney(m[2]);
    }
  }

  return {
    openingDate,
    openingBalance,
    closingDate,
    closingBalance,
    label: closingDate ? monthLabel(closingDate) : 'Unknown',
  };
}

// ── Transaction parsing ───────────────────────────────────────────────────────

function parseTransactions(lines: string[]): TransactionGroups {
  const groups: TransactionGroups = { purchase: [], recurring: [], misc: [], deposit: [], investments: [] };
  for (const line of lines) {
    const tx = parseLine(line);
    if (tx) groups[tx.category].push(tx);
  }
  return groups;
}

function parseLine(raw: string): Transaction | null {
  const line = raw.trim();
  if (!/^\d{2}\/\d{2}\b/.test(line)) return null;

  // Find all X,XXX.XX-style amounts
  const nums = [...line.matchAll(/\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g)];
  if (!nums.length) return null;

  // Truist transaction rows have exactly: date | description | amount
  // (no running-balance column), so the last decimal number is the amount
  const amountStr  = nums[nums.length - 1][1];
  const amount     = parseMoney(amountStr);
  if (!amount) return null;

  const date        = line.slice(0, 5);
  const rest        = line.slice(5).trim();
  const amtIdx      = rest.lastIndexOf(amountStr);
  const description = (amtIdx > 0 ? rest.slice(0, amtIdx) : rest).trim();

  const up = description.toUpperCase();
  let category: CategoryKey;
  if (/DEBIT\s+CARD\s+PURCHASE/.test(up))       category = 'purchase';
  else if (/DEBIT\s+CARD\s+MISC\s+DEBIT/.test(up)) category = 'purchase';
  else if (/INT'L\s+SERVICE\s+ASSESSMENT\s+FEE/i.test(description)) category = 'purchase';
  else if (/DEBIT\s+CARD\s+RECURRING/.test(up)) category = 'recurring';
  else if (/ZELLE\s+PAYMENT\s+TO/i.test(description))              category = 'purchase';
  else if (/^TRUIST\s+ONLINE\s+TRANSFER\s+MOBILE\s+TO/i.test(description)) category = 'purchase';
  else if (/^DEBIT\s+CARD\s+RETURN/i.test(description))            category = 'deposit';
  else if (/^VISA\s+MONEY\s+TRANSFER\s+DEBIT/i.test(description))  category = 'purchase';
  else if (/^WISE\s+Wise\s+Inc/i.test(description))                category = 'purchase';
  else if (/ATM\s+NETWORK\s+CASH\s+WITHDRAWAL/i.test(description)) category = 'purchase';
  else if (
    /ZELLE\s+PAYMENT\s+FROM/i.test(description) ||
    /ACH\s+PAYMEN/i.test(description) ||
    /PAYROLL/i.test(description) ||
    /^TAX\s+REF\s+IRS/i.test(description) ||
    /^NYSTTAXRFD/i.test(description) ||
    /^VISA\s+MONEY\s+TRANSFER\s+CREDIT/i.test(description) ||
    /TRUIST\s+ONLINE\s+TRANSFER\s+MOBILE\s+FROM/i.test(description) ||
    /TRUIST\s+ONLINE\s+TRANSFER\s+ONLINE\s+FROM/i.test(description) ||
    /DIRECT\s+DEP/i.test(description) ||
    /DIR\s+DEP/i.test(description) ||
    /DEPOSIT/i.test(description) ||
    /^TRANSFER/i.test(description)
  )                                              category = 'deposit';
  else if (
    /ROBINHOOD/i.test(description) ||
    /COINBASE/i.test(description) ||
    /FID/i.test(description)
  )                                              category = 'investments';
  else if (/^INTERNET\s+PAYMENT/i.test(description)) category = 'purchase';
  else                                           category = 'misc';

  return { date, description, amount, category };
}
