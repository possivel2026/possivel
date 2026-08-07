import { corsHeaders, json } from '../_shared/cors.ts';
import { userClient, admin } from '../_shared/supabase.ts';

function env(name: string) {
  return Deno.env.get(name);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const userDb = await userClient(req);
  const { data: { user }, error: userError } = await userDb.auth.getUser();
  if (userError || !user) return json({ error: 'Não autenticado' }, 401);

  const { paymentId } = await req.json().catch(() => ({ paymentId: null }));
  if (!paymentId) return json({ error: 'paymentId é obrigatório' }, 400);

  const db = admin();
  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('id,payer_id,amount,purpose,status,provider')
    .eq('id', paymentId)
    .eq('payer_id', user.id)
    .maybeSingle();

  if (paymentError) return json({ error: paymentError.message }, 400);
  if (!payment) return json({ error: 'Pagamento não encontrado' }, 404);
  if (payment.status !== 'pending') return json({ error: 'Pagamento não está pendente' }, 409);

  const token = env('MERCADO_PAGO_ACCESS_TOKEN');
  if (!token) return json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado' }, 500);

  const appUrl = env('APP_URL') ?? 'https://marcelinfreefire153-arch.github.io/possivel/';
  const notificationUrl = env('PAYMENT_WEBHOOK_URL');
  const preference = {
    items: [{
      id: String(payment.id),
      title: payment.purpose || 'Pagamento Possível',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: Number(payment.amount),
    }],
    payer: { email: user.email },
    external_reference: String(payment.id),
    back_urls: {
      success: `${appUrl}?payment=success`,
      pending: `${appUrl}?payment=pending`,
      failure: `${appUrl}?payment=failure`,
    },
    auto_return: 'approved',
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) return json({ error: await response.text() }, 502);
  const data = await response.json();

  await db.from('payments').update({
    provider: 'mercadopago',
    provider_reference: String(data.id),
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id);

  return json({ checkout_url: data.init_point ?? data.sandbox_init_point, preference_id: data.id });
});
