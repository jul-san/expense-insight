'use client';

import { useEffect, useRef, useState } from 'react';
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

type ChartType = 'line' | 'bar';

export function BalanceChart({ statements }: { statements: Statement[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('line');

  useEffect(() => {
    if (!canvasRef.current || statements.length === 0) return;

    const { labels, data } = buildChartData(statements);
    const ctx = canvasRef.current.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, 'rgba(124,58,237,0.18)');
    grad.addColorStop(1, 'rgba(124,58,237,0)');

    const dataset = chartType === 'line'
      ? {
          label: 'Account Balance',
          data,
          borderColor: '#7c3aed',
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#7c3aed',
          pointBorderColor: 'rgba(255,255,255,0.9)',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      : {
          label: 'Account Balance',
          data,
          backgroundColor: 'rgba(124,58,237,0.7)',
          borderColor: '#6d28d9',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false as const,
          hoverBackgroundColor: 'rgba(109,40,217,0.85)',
        };

    const chart = new Chart(ctx, {
      type: chartType,
      data: { labels, datasets: [dataset] },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
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
              label: (c) => ' Balance: ' + fmt(c.parsed.y ?? 0),
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: 'rgba(91,33,182,0.6)',
              callback: (v) => '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }),
            },
            grid: { color: 'rgba(124,58,237,0.08)' },
            border: { color: 'transparent' },
          },
          x: {
            grid: { display: false },
            border: { color: 'transparent' },
            ticks: { maxRotation: 30, color: 'rgba(91,33,182,0.6)' },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [statements, chartType]);

  return (
    <div>
      <div className="chart-header">
        <h2>Account Balance Over Time</h2>
        <div className="chart-toggle">
          <button
            className={chartType === 'line' ? 'active' : ''}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
          <button
            className={chartType === 'bar' ? 'active' : ''}
            onClick={() => setChartType('bar')}
          >
            Bar
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ maxHeight: 280, maxWidth: '100%' }} />
    </div>
  );
}
