import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = (await headers()).get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response('Missing signature', { status: 400 });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
    const event = stripe.webhooks.constructEvent(buf, sig, secret);
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const name = (s.metadata?.name as string) || 'Unknown';
      const email = (s.metadata?.email as string) || (s.customer_details?.email as string) || '';
      const amount = (s.amount_total || 0);
      await prisma.ticket.create({
        data: { name, email, paymentProvider: 'stripe', paymentId: s.id, amountCents: amount, status: 'paid' }
      });
    }
    return new Response('ok', { status: 200 });
  } catch (e: any) {
    return new Response(`Webhook Error: ${e.message}`, { status: 400 });
  }
}
