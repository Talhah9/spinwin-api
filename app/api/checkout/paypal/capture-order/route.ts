import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/db';
import { ensureCors, preflight } from '../../../../../lib/cors';

export async function OPTIONS() { return preflight(); }

async function getAccessToken(){
  const base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if(!res.ok) throw new Error('PayPal auth failed');
  const j = await res.json(); return j.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const orderId = String(data.orderId || '');
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    if (!orderId) return ensureCors(new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400 }));

    const token = await getAccessToken();
    const base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
    const res = await fetch(base + `/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    const j = await res.json();
    if (!res.ok) return ensureCors(new Response(JSON.stringify(j), { status: 400 }));

    const capture = j.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = Math.round(Number(capture?.amount?.value || '0') * 100);

    await prisma.ticket.create({
      data: { name, email, paymentProvider: 'paypal', paymentId: capture?.id || orderId, amountCents: amount, status: 'paid' }
    });

    return ensureCors(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  } catch (e: any) {
    return ensureCors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
  }
}
