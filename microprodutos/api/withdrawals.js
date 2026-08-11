const CREATOR_ID_DEFAULT = '6ae17221-3858-4d8c-8c42-5bbc4d0753ec';

async function authCreator(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('supabase_not_configured');
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const user = await r.json();
  return user?.id === (process.env.CREATOR_USER_ID || CREATOR_ID_DEFAULT) ? user : null;
}

async function serviceRequest(path, options={}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('service_role_not_configured');
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type':'application/json',
      Prefer:'return=representation',
      ...(options.headers||{})
    }
  });
  const text = await r.text();
  const data = text ? (()=>{ try { return JSON.parse(text); } catch { return text; } })() : null;
  return { ok:r.ok, status:r.status, data };
}

async function currentAvailable() {
  const r = await serviceRequest('rpc/wayne_financial_summary', { method:'POST', body:'{}' });
  if (!r.ok) return null;
  return Number(r.data?.available ?? 0);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
  try {
    const user = await authCreator(req);
    if (!user) return res.status(403).json({ error:'creator_only' });
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000000) return res.status(400).json({ error:'invalid_amount' });
    const rounded = Math.round(amount * 100) / 100;

    const rpc = await serviceRequest('rpc/request_wayne_withdrawal', {
      method:'POST',
      body:JSON.stringify({ p_creator_user_id:user.id, p_amount:rounded })
    });

    if (!rpc.ok) {
      const message = typeof rpc.data === 'object' ? String(rpc.data?.message || '') : String(rpc.data || '');
      if (message.includes('insufficient_available_balance')) {
        const available = await currentAvailable();
        return res.status(409).json({ error:'insufficient_available_balance', available });
      }
      if (message.includes('invalid_amount')) return res.status(400).json({ error:'invalid_amount' });
      throw new Error(`withdrawal_rpc_${rpc.status}`);
    }

    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    return res.status(201).json({
      ok:true,
      withdrawal:row || null,
      note:'Solicitação registrada e saldo reservado de forma atômica. A transferência bancária real depende da conta financeira configurada no provedor.'
    });
  } catch(e) {
    console.error(e);
    return res.status(503).json({ error:'withdrawal_backend_unavailable' });
  }
};
