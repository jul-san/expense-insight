import { readdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const dir = join(process.cwd(), 'public', 'synthetic_statements');
  const files = await readdir(dir);
  return NextResponse.json(files.filter(f => f.toLowerCase().endsWith('.pdf')).sort());
}
