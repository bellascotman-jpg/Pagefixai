import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ publicKey: string }> }) {
  const { publicKey } = await context.params;
  const experiment = await db.experiment.findUnique({
    where: { publicKey },
    select: { publicKey: true, targetUrlPattern: true, selector: true, controlText: true, variantText: true, status: true },
  });
  if (!experiment || experiment.status !== 'RUNNING') return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ active: true, experiment }, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
