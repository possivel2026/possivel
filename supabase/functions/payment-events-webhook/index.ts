import { json } from '../_shared/cors.ts';
import { admin } from '../_shared/supabase.ts';
import { getMercadoPagoEventId, validateMercadoPagoWebhookSignature, InvalidWebhookSignatureError } from '../_shared/webhook-signature.ts';

function mapStatus(status?: string) {
  if (status === 'approved') return 'paid';
  if (status === 'refunded' || status === 'charged_back') return 'refunded';
  if (status === 'rejected' || status === 'cancelled') return 'failed';
  return 'pending';
}

Deno.serve(async (req) => {
  const eventId = getMercadoPagoEventId(req.url);
  try {
    await validateMercadoPagoWebhookSignature({
      signature: req.headers.get('x-signature'),
      requestId: req.headers.get('x-request-id'),
      eventId,
      secret: Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET'),
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return json({ error: error.message }, 401);
    throw error;
  }

  const payload = await req.json().catch(() => ({}));
  const paymentId = String((payload as { data?: { id?: unknown } }).data?.id ?? eventId ?? '');
  if (!paymentId) return json({ error: 'Evento sem ID de pagamento' }, 400);

  const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  if (!token) return json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado' }, 500);

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return json({ error: await response.text() }, 502);
  const providerPayment = await response.json();

  const internalId = Number(providerPayment.external_reference);
  if (!Number.isFinite(internalId)) return json({ error: 'external_reference inválida' }, 400);

  const db = admin();
  const eventKey = `payment:${paymentId}:${providerPayment.status}`;
  const { error: eventError } = await db.from('payment_webhook_events').insert({
    provider: 'mercadopago',
    event_id: eventKey,
    event_type: String(providerPayment.status ?? 'unknown'),
    payload: providerPayment,
  });
  if (eventError?.code === '23505') return json({ ok: true, duplicate: true });
  if (eventError) return json({ error: eventError.message }, 400);

  const status = mapStatus(providerPayment.status);
  const { data: updated, error: updateError } = await db.from('payments').update({
    status,
    provider_reference: String(paymentId),
    updated_at: new Date().toISOString(),
  }).eq('id', internalId).select('id,payer_id,purpose').maybeSingle();
  if (updateError) return json({ error: updateError.message }, 400);

  if (updated?.payer_id) {
    await db.from('notifications').insert({
      user_id: updated.payer_id,
      type: 'payment',
      title: status === 'paid' ? 'Pagamento confirmado' : 'Pagamento atualizado',
      body: `${updated.purpose || 'Pagamento'}: ${status}`,
      link: '#causes',
    });
  }

  await db.from('payment_webhook_events').update({ processed_at: new Date().toISOString() })
    .eq('provider', 'mercadopago').eq('event_id', eventKey);

  return json({ ok: true, status });
});
