'use client';

import { useState, useCallback } from 'react';
import type { Statement } from '@/lib/types';
import { processFile } from '@/lib/parser';
import { UploadZone } from '@/components/UploadZone';
import { BalanceChart } from '@/components/BalanceChart';
import { SpendingDonut } from '@/components/SpendingDonut';
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
        <div className="header-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="20" width="6" height="12" rx="2" fill="#7c3aed" opacity="0.7"/>
            <rect x="13" y="13" width="6" height="19" rx="2" fill="#8b5cf6"/>
            <rect x="22" y="8" width="6" height="24" rx="2" fill="#a78bfa"/>
            <path d="M6 18L13 12L20 15L30 5" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M26 5H30V9" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1>Expense Insight</h1>
        </div>
        <p>Upload Truist bank statements to track spending and account balance over time</p>
        <p className="privacy-note">
          <span className="privacy-icon">!</span>
          Your statements are processed entirely in your browser. No data is uploaded or stored anywhere.
        </p>
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
              <div className="chart-split">
                <div className="chart-pane">
                  <h2>Spending by Category</h2>
                  <SpendingDonut statements={statements} />
                </div>
                <div className="chart-split-divider" />
                <div className="chart-pane">
                  <BalanceChart statements={statements} />
                </div>
              </div>
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
