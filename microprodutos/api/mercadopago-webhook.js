module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
  try {
    const { WebhookSignatureValidator } = await import('mercadopago');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const dataId = req.query?.['data.id'] || req.body?.data?.id;
    if (!secret || !accessToken) return res.status(503).json({ error:'mercadopago_not_configured' });
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId: String(dataId || ''),
      secret
    });
    if (!dataId) return res.status(200).json({ ok:true, ignored:true });
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers:{ Authorization:`Bearer ${accessToken}` } });
    if (!paymentRes.ok) throw new Error(`mercadopago_payment_${paymentRes.status}`);
    const p = await paymentRes.json();
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('supabase_not_configured');
    const payload = {
      external_payment_id:String(p.id),
      amount:Number(p.transaction_amount || 0),
      currency:p.currency_id || 'BRL',
      status:p.status || 'unknown',
      source:'mercadopago',
      metadata:{ payment_method_id:p.payment_method_id || null, live_mode:Boolean(p.live_mode), date_approved:p.date_approved || null }
    };
    const db = await fetch(`${url}/rest/v1/revenue_events?on_conflict=external_payment_id`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal' }, body:JSON.stringify(payload) });
    if (!db.ok) throw new Error(`supabase_revenue_${db.status}`);
    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error:'invalid_or_unavailable_webhook' });
  }
};
