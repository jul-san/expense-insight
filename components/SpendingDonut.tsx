'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables, type Plugin } from 'chart.js';
import type { Statement } from '@/lib/types';
import { fmt, sumOf } from '@/lib/format';

Chart.register(...registerables);

export function SpendingDonut({ statements }: { statements: Statement[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || statements.length === 0) return;

    let purchase = 0, recurring = 0, misc = 0, income = 0;
    for (const s of statements) {
      purchase  += sumOf(s.transactions.purchase);
      recurring += sumOf(s.transactions.recurring);
      misc      += sumOf(s.transactions.misc);
      income    += sumOf(s.transactions.income);
    }
    const grandTotal = purchase + recurring + misc;

    const centerTextPlugin: Plugin<'doughnut'> = {
      id: 'centerText',
      beforeDraw(chart) {
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        const cx = left + width / 2;
        const cy = top + height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(91,33,182,0.55)';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText('TOTAL SPENT', cx, cy - 14);

        ctx.fillStyle = '#1e1b4b';
        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillText(fmt(grandTotal), cx, cy + 10);

        ctx.restore();
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: ['Purchases', 'Recurring', 'Misc', 'Income'],
        datasets: [{
          data: [purchase, recurring, misc, income],
          backgroundColor: [
            'rgba(79,70,229,0.8)',
            'rgba(15,118,110,0.8)',
            'rgba(147,51,234,0.8)',
            'rgba(22,163,74,0.8)',
          ],
          borderColor: ['#4f46e5', '#0f766e', '#9333ea', '#16a34a'],
          borderWidth: 2,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(49,46,129,0.85)',
              font: { size: 12, family: 'Inter, sans-serif' },
              padding: 18,
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
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
    <div style={{ maxHeight: 260, display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ maxHeight: 260 }} />
    </div>
  );
}
