import type { Statement } from '@/lib/types';
import { fmt, sumOf } from '@/lib/format';

export function SpendingTable({ statements }: { statements: Statement[] }) {
  const totals = { purchase: 0, recurring: 0, misc: 0 };

  const rows = statements.map(s => {
    const p = sumOf(s.transactions.purchase);
    const r = sumOf(s.transactions.recurring);
    const m = sumOf(s.transactions.misc);
    totals.purchase += p;
    totals.recurring += r;
    totals.misc += m;
    return { label: s.label, p, r, m, t: p + r + m, bal: s.closingBalance };
  });

  const grand = totals.purchase + totals.recurring + totals.misc;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th style={{ color: 'var(--purchase)' }}>Purchases</th>
            <th style={{ color: 'var(--recurring)' }}>Recurring</th>
            <th style={{ color: 'var(--misc)' }}>Misc</th>
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
              <td className="td-total">{fmt(row.t)}</td>
              <td className="td-balance">{row.bal != null ? fmt(row.bal) : '—'}</td>
            </tr>
          ))}
          <tr className="row-total">
            <td className="td-period">All Periods</td>
            <td className="td-purchase">{fmt(totals.purchase)}</td>
            <td className="td-recurring">{fmt(totals.recurring)}</td>
            <td className="td-misc">{fmt(totals.misc)}</td>
            <td className="td-total">{fmt(grand)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
