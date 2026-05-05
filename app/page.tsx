'use client';

import { useState, useCallback } from 'react';
import type { Statement } from '@/lib/types';
import { processFile } from '@/lib/parser';
import { UploadZone } from '@/components/UploadZone';
import { BalanceChart } from '@/components/BalanceChart';
import { SpendingTable } from '@/components/SpendingTable';
import { TransactionDetails } from '@/components/TransactionDetails';

export default function Home() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [status, setStatus]         = useState('');

  const handleFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.txt') ||
      f.type === 'application/pdf'
    );
    if (!valid.length) { setStatus('No PDF or TXT files found.'); return; }

    setStatus(`Processing ${valid.length} file${valid.length > 1 ? 's' : ''}…`);

    let added = 0;
    const next = [...statements];

    for (const file of valid) {
      try {
        const stmt = await processFile(file);
        if (!stmt.closingDate) {
          setStatus(`Skipped "${file.name}" — couldn't find statement dates.`);
          continue;
        }
        const key = stmt.closingDate.getTime();
        const idx = next.findIndex(s => s.closingDate?.getTime() === key);
        if (idx >= 0) next[idx] = stmt;
        else next.push(stmt);
        added++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus(`Error reading "${file.name}": ${msg}`);
      }
    }

    if (added) {
      next.sort((a, b) => (a.closingDate?.getTime() ?? 0) - (b.closingDate?.getTime() ?? 0));
      setStatements(next);
      setStatus('');
    }
  }, [statements]);

  const removeStatement = useCallback((idx: number) => {
    setStatements(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const hasStatements = statements.length > 0;

  return (
    <>
      <header>
        <h1>Expense Insight</h1>
        <p>Upload Truist bank statements to track spending and account balance over time</p>
      </header>

      <main>
        <UploadZone compact={hasStatements} onFiles={handleFiles} />

        {status && <div id="status">{status}</div>}

        {hasStatements && (
          <>
            <div id="chipRow">
              {statements.map((s, i) => (
                <span key={s.closingDate?.toISOString() ?? i} className="chip">
                  <span className="chip-dot" />
                  {s.label}
                  <button
                    className="chip-remove"
                    onClick={() => removeStatement(i)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="section-block">
              <h2>Account Balance Over Time</h2>
              <BalanceChart statements={statements} />
            </div>

            <div className="section-block">
              <h2>Spending by Statement Period</h2>
              <SpendingTable statements={statements} />
            </div>

            <TransactionDetails statements={statements} />
          </>
        )}
      </main>
    </>
  );
}
