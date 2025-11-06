import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/db';
import { ensureCors, preflight } from '../../../../lib/cors';

export async function OPTIONS() { return preflight(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const provider = String(body.provider || 'manual');
    const paymentId = String(body.paymentId || 'manual-' + Date.now());
    const amountCents = Number(body.amountCents || 0);
    const status = String(body.status || 'paid');
    if (!name || !email) return ensureCors(new Response(JSON.stringify({ error: 'Missing name/email' }), { status: 400 }));

    const t = await prisma.ticket.create({
      data: { name, email, paymentProvider: provider, paymentId, amountCents, status }
    });
    return ensureCors(new Response(JSON.stringify({ id: t.id }), { status: 200 }));
  } catch (e: any) {
    return ensureCors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
  }
}
