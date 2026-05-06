'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, type Plugin } from 'chart.js';
import type { Statement } from '@/lib/types';
import { fmt, sumOf } from '@/lib/format';

Chart.register(...registerables);

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22"/>
      <line x1="6" y1="18" x2="6" y2="11"/>
      <line x1="10" y1="18" x2="10" y2="11"/>
      <line x1="14" y1="18" x2="14" y2="11"/>
      <line x1="18" y1="18" x2="18" y2="11"/>
      <polygon points="12 2 20 7 4 7"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  Purchases:   <CartIcon />,
  Recurring:   <RepeatIcon />,
  Investments: <TrendingUpIcon />,
  Deposit:     <BankIcon />,
  Misc:        <SparkleIcon />,
};

interface Slice { label: string; value: number; bg: string; border: string }

function buildSlices(statements: Statement[]): { slices: Slice[]; grandNet: number } {
  let purchase = 0, recurring = 0, misc = 0, deposit = 0, investments = 0;
  for (const s of statements) {
    purchase    += sumOf(s.transactions.purchase);
    recurring   += sumOf(s.transactions.recurring);
    misc        += sumOf(s.transactions.misc);
    deposit     += sumOf(s.transactions.deposit);
    investments += sumOf(s.transactions.investments);
  }
  const slices: Slice[] = [
    { label: 'Purchases',   value: purchase,    bg: 'rgba(79,70,229,0.8)',  border: '#4f46e5' },
    { label: 'Recurring',   value: recurring,   bg: 'rgba(15,118,110,0.8)', border: '#0f766e' },
    { label: 'Investments', value: investments, bg: 'rgba(217,119,6,0.8)',  border: '#d97706' },
    { label: 'Deposit',     value: deposit,     bg: 'rgba(22,163,74,0.8)',  border: '#16a34a' },
    ...(misc > 0 ? [{ label: 'Misc', value: misc, bg: 'rgba(147,51,234,0.8)', border: '#9333ea' }] : []),
  ];
  return { slices, grandNet: deposit - (purchase + recurring + misc + investments) };
}

export function SpendingDonut({ statements }: { statements: Statement[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { slices, grandNet } = buildSlices(statements);
  const chartTotal = slices.reduce((a, s) => a + s.value, 0);

  useEffect(() => {
    if (!canvasRef.current || statements.length === 0) return;

    const { slices: s, grandNet: net } = buildSlices(statements);

    const centerTextPlugin: Plugin<'doughnut'> = {
      id: 'centerText',
      beforeDraw(chart) {
        if (!chart.chartArea) return;
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        const cx = left + width / 2;
        const cy = top + height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(91,33,182,0.55)';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText('NET', cx, cy - 14);
        ctx.fillStyle = '#1e1b4b';
        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillText(fmt(net), cx, cy + 10);
        ctx.restore();
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: s.map(x => x.label),
        datasets: [{
          data: s.map(x => x.value),
          backgroundColor: s.map(x => x.bg),
          borderColor: s.map(x => x.border),
          borderWidth: 2,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderColor: 'rgba(124,58,237,0.25)',
            borderWidth: 1,
            titleColor: 'rgba(91,33,182,0.8)',
            bodyColor: '#1e1b4b',
            padding: 10,
            callbacks: {
              label: (c) => ` ${c.label}: ${fmt(c.parsed)}`,
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [statements]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ flexShrink: 0, width: 220, height: 220 }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slices.map(s => {
          const pct = chartTotal > 0 ? ((s.value / chartTotal) * 100).toFixed(1) : '0.0';
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: s.border, flexShrink: 0, display: 'flex' }}>
                {ICONS[s.label]}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b', lineHeight: 1.2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>
                  {fmt(s.value)}&ensp;
                  <span style={{ color: s.border, fontWeight: 600 }}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
