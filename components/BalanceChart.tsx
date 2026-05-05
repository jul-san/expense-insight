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
    grad.addColorStop(0, 'rgba(79,70,229,0.18)');
    grad.addColorStop(1, 'rgba(79,70,229,0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Account Balance',
          data,
          borderColor: '#4f46e5',
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
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
            callbacks: {
              label: (c) => ' Balance: ' + fmt(c.parsed.y ?? 0),
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }),
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 30 },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [statements]);

  return <canvas ref={canvasRef} style={{ maxHeight: 280 }} />;
}
