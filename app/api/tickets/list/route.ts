import { withCors, preflight } from '../../../../../lib/cors';
import { prisma } from '../../../../../lib/db';
import { NextRequest } from 'next/server';

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function GET(req: NextRequest) {
  const items = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return withCors(req, new Response(JSON.stringify({ items }), { status: 200, headers: { 'content-type': 'application/json' } }));
}
