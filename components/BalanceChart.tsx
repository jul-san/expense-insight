'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { Statement } from '@/lib/types';
import { fmtDateLabel, fmt } from '@/lib/format';

Chart.register(...registerables);

interface ChartPoint { date: Date; balance: number }

function buildChartData(statements: Statement[]) {
  const pointMap = new Map<string, ChartPoint>();

  const earliest = statements[0];
  if (earliest.openingDate && earliest.openingBalance != null) {
    const k = earliest.openingDate.toISOString().slice(0, 10);
    pointMap.set(k, { date: earliest.openingDate, balance: earliest.openingBalance });
  }

  for (const s of statements) {
    if (s.closingDate && s.closingBalance != null) {
      const k = s.closingDate.toISOString().slice(0, 10);
      pointMap.set(k, { date: s.closingDate, balance: s.closingBalance });
    }
  }

  const pts = [...pointMap.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    labels: pts.map(p => fmtDateLabel(p.date)),
    data:   pts.map(p => p.balance),
  };
}

export function BalanceChart({ statements }: { statements: Statement[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || statements.length === 0) return;

    const { labels, data } = buildChartData(statements);
    const ctx  = canvasRef.current.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, 'rgba(167,139,250,0.35)');
    grad.addColorStop(1, 'rgba(167,139,250,0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Account Balance',
          data,
          borderColor: '#a78bfa',
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#a78bfa',
          pointBorderColor: 'rgba(5,0,15,0.8)',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,5,35,0.92)',
            borderColor: 'rgba(139,92,246,0.4)',
            borderWidth: 1,
            titleColor: 'rgba(196,181,253,0.85)',
            bodyColor: '#ffffff',
            padding: 10,
            callbacks: {
              label: (c) => ' Balance: ' + fmt(c.parsed.y ?? 0),
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: 'rgba(196,181,253,0.65)',
              callback: (v) => '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }),
            },
            grid: { color: 'rgba(139,92,246,0.1)' },
            border: { color: 'transparent' },
          },
          x: {
            grid: { display: false },
            border: { color: 'transparent' },
            ticks: { maxRotation: 30, color: 'rgba(196,181,253,0.65)' },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [statements]);

  return <canvas ref={canvasRef} style={{ maxHeight: 280 }} />;
}
