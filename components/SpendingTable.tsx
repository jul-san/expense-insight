import type { Statement } from '@/lib/types';
import { fmt, sumOf } from '@/lib/format';

export function SpendingTable({ statements }: { statements: Statement[] }) {
  const totals = { purchase: 0, recurring: 0, misc: 0, deposit: 0, investments: 0 };

  const rows = statements.map(s => {
    const p = sumOf(s.transactions.purchase);
    const r = sumOf(s.transactions.recurring);
    const m = sumOf(s.transactions.misc);
    const n = sumOf(s.transactions.deposit);
    const v = sumOf(s.transactions.investments);
    totals.purchase    += p;
    totals.recurring   += r;
    totals.misc        += m;
    totals.deposit      += n;
    totals.investments += v;
    return { label: s.label, p, r, m, n, v, t: p + r + m + v, bal: s.closingBalance };
  });

  const grandSpent = totals.purchase + totals.recurring + totals.misc + totals.investments;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th style={{ color: 'var(--purchase)' }}>Purchases</th>
            <th style={{ color: 'var(--recurring)' }}>Recurring</th>
            <th style={{ color: 'var(--misc)' }}>Misc</th>
            <th style={{ color: 'var(--investments)' }}>Investments</th>
            <th style={{ color: 'var(--deposit)' }}>Deposit</th>
            <th>Total Spent</th>
            <th>Closing Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <td className="td-period">{row.label}</td>
              <td className="td-purchase">{fmt(row.p)}</td>
              <td className="td-recurring">{fmt(row.r)}</td>
              <td className="td-misc">{fmt(row.m)}</td>
              <td className="td-investments">{fmt(row.v)}</td>
              <td className="td-deposit">{fmt(row.n)}</td>
              <td className="td-total">{fmt(row.t)}</td>
              <td className="td-balance">{row.bal != null ? fmt(row.bal) : '—'}</td>
            </tr>
          ))}
          <tr className="row-total">
            <td className="td-period">All Periods</td>
            <td className="td-purchase">{fmt(totals.purchase)}</td>
            <td className="td-recurring">{fmt(totals.recurring)}</td>
            <td className="td-misc">{fmt(totals.misc)}</td>
            <td className="td-investments">{fmt(totals.investments)}</td>
            <td className="td-deposit">{fmt(totals.deposit)}</td>
            <td className="td-total">{fmt(grandSpent)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
