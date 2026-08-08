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

async function db(path, options={}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('service_role_not_configured');
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation', ...(options.headers||{}) }
  });
  if (!r.ok) throw new Error(`supabase_rest_${r.status}`);
  const text = await r.text();
  return text ? JSON.parse(text) : [];
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
  try {
    const user = await authCreator(req);
    if (!user) return res.status(403).json({ error:'creator_only' });
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 1) return res.status(400).json({ error:'invalid_amount' });

    const revenue = await db('revenue_events?select=amount,status');
    const withdrawals = await db('withdrawal_requests?select=amount,status');
    const gross = revenue.filter(x=>x.status==='approved').reduce((s,x)=>s+Number(x.amount||0),0);
    const reserved = withdrawals.filter(x=>['requested','processing','paid'].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0);
    const available = Math.max(0,gross-reserved);
    if (amount > available) return res.status(409).json({ error:'insufficient_available_balance', available });

    const row = await db('withdrawal_requests', { method:'POST', body:JSON.stringify({ creator_user_id:user.id, amount, currency:'BRL', status:'requested', destination_label:'Wayne Corporation' }) });
    return res.status(201).json({ ok:true, withdrawal:row[0] || null, note:'A solicitação foi registrada. A liquidação real depende da conta do provedor de pagamentos e deve ser executada/confirmada pelo canal financeiro configurado.' });
  } catch(e) {
    console.error(e);
    return res.status(503).json({ error:'withdrawal_backend_unavailable', detail:String(e.message||e) });
  }
};
