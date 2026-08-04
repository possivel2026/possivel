import { corsHeaders, json } from '../_shared/cors.ts';
import { admin } from '../_shared/supabase.ts';
import { InvalidWebhookSignatureError } from '../_shared/webhook-signature.ts';
import { MercadoPagoProvider } from '../_shared/payment-provider.ts';

function mapStatus(status?: string) {
  if (status === 'authorized') return 'active';
  if (status === 'paused') return 'past_due';
  if (status === 'cancelled') return 'canceled';
  if (status === 'pending') return 'pending';
  return 'pending';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const provider = new MercadoPagoProvider();
  let event;

  try {
    event = await provider.validateWebhook(req);
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return json({ error: error.message }, 401);
    throw error;
  }

  const db = admin();
  const { error: insertError } = await db.from('payment_webhook_events').insert({
    provider: 'mercadopago',
    event_id: event.id,
    event_type: event.type,
    payload: event.payload,
  });

  if (insertError?.code === '23505') return json({ ok: true, duplicate: true });
  if (insertError) return json({ error: insertError.message }, 400);

  if (event.providerSubscriptionId) {
    const subscription = await provider.getSubscription(event.providerSubscriptionId);
    await db
      .from('subscriptions')
      .update({
        status: mapStatus(subscription.status),
        plan: 'pro',
        updated_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 32 * 864e5).toISOString(),
      })
      .eq('provider_subscription_id', event.providerSubscriptionId);
  }

  await db
    .from('payment_webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('provider', 'mercadopago')
    .eq('event_id', event.id);

  return json({ ok: true });
});
