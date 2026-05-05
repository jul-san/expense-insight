export function fmt(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parseMoney(s: string): number {
  return parseFloat(s.replace(/,/g, ''));
}

export function parseMMDDYYYY(s: string): Date {
  const parts = s.split('/').map(Number);
  return new Date(parts[2], parts[0] - 1, parts[1]);
}

export function monthLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function fmtDateLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function sumOf(list: Array<{ amount: number }>): number {
  return list.reduce((s, t) => s + t.amount, 0);
}
