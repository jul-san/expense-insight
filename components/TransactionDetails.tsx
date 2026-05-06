'use client';

import { useState } from 'react';
import type { Statement, CategoryKey, CategoryInfo, MergedTransaction } from '@/lib/types';
import { CATS } from '@/lib/types';
import { fmt, sumOf } from '@/lib/format';

function Accordion({
  info,
  list,
}: {
  info: CategoryInfo;
  list: MergedTransaction[];
}) {
  const [open, setOpen] = useState(false);
  const total = sumOf(list);

  return (
    <div className="accordion" style={{ '--clr': info.color } as React.CSSProperties}>
      <div
        className={`acc-header${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="acc-left">
          <span className="badge">{list.length}</span>
          <h3>{info.label}</h3>
        </div>
        <div className="acc-right">
          <span className="acc-total">{fmt(total)}</span>
          <span className="chevron">▼</span>
        </div>
      </div>
      <div className={`acc-body${open ? ' open' : ''}`}>
        {list.map((tx, i) => (
          <div
            key={i}
            className="tx-row"
            style={{ '--clr': info.color } as React.CSSProperties}
          >
            <span className="tx-date">{tx.date}</span>
            <span className="tx-desc">{tx.description}</span>
            <span className="tx-amt">{fmt(tx.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransactionDetails({ statements }: { statements: Statement[] }) {
  const merged: Record<CategoryKey, MergedTransaction[]> = {
    purchase: [], recurring: [], misc: [], income: [],
  };

  for (const s of statements) {
    (Object.keys(CATS) as CategoryKey[]).forEach(cat => {
      s.transactions[cat].forEach(tx =>
        merged[cat].push({ ...tx, _period: s.label })
      );
    });
  }

  return (
    <>
      <div className="cat-grid">
        {(Object.entries(CATS) as [CategoryKey, CategoryInfo][]).map(([key, info]) => (
          <div
            key={key}
            className="cat-card"
            style={{ '--clr': info.color } as React.CSSProperties}
          >
            <div className="cat-label">{info.label}</div>
            <div className="cat-amount">{fmt(sumOf(merged[key]))}</div>
            <div className="cat-count">
              {merged[key].length} transaction{merged[key].length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {(Object.entries(CATS) as [CategoryKey, CategoryInfo][])
        .filter(([key]) => merged[key].length > 0)
        .map(([key, info]) => (
          <Accordion key={key} info={info} list={merged[key]} />
        ))}
    </>
  );
}
