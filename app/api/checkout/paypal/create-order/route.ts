import { NextRequest } from 'next/server';
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
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const price = Number(process.env.TICKET_PRICE_EUR || 2);
    if (!name || !email) return ensureCors(new Response(JSON.stringify({ error: 'Missing name/email' }), { status: 400 }));

    const token = await getAccessToken();
    const base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
    const res = await fetch(base + '/v2/checkout/orders', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'EUR', value: String(price.toFixed(2)) } }],
        application_context: { shipping_preference: 'NO_SHIPPING' }
      })
    });
    const j = await res.json();
    if (!res.ok) return ensureCors(new Response(JSON.stringify(j), { status: 400 }));
    return ensureCors(new Response(JSON.stringify({ id: j.id }), { status: 200 }));
  } catch (e: any) {
    return ensureCors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
  }
}
