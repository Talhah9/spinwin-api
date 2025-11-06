import { prisma } from '../../../../lib/db';

export async function GET() {
  const items = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return new Response(JSON.stringify({ items }), { status: 200, headers: { 'content-type': 'application/json' } });
}
