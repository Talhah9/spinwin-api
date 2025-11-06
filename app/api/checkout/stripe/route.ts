import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { ensureCors, preflight } from '../../../../lib/cors';

export async function OPTIONS() { return preflight(); }

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const price = Number(process.env.TICKET_PRICE_EUR || 2);
    if (!name || !email) return ensureCors(new Response(JSON.stringify({ error: 'Missing name/email' }), { status: 400 }));

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: { currency: 'eur', unit_amount: Math.round(price * 100), product_data: { name: 'Ticket SpinWin' } },
        quantity: 1
      }],
      metadata: { name, email },
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL
    });
    return ensureCors(new Response(JSON.stringify({ url: session.url }), { status: 200 }));
  } catch (e: any) {
    return ensureCors(new Response(JSON.stringify({ error: e.message || 'Stripe error' }), { status: 500 }));
  }
}
