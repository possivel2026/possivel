const CREATOR_ID_DEFAULT = '6ae17221-3858-4d8c-8c42-5bbc4d0753ec';

async function creatorFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('supabase_not_configured');
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const user = await r.json();
  const creatorId = process.env.CREATOR_USER_ID || CREATOR_ID_DEFAULT;
  return user && user.id === creatorId ? user : null;
}

async function rest(path) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('service_role_not_configured');
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`supabase_rest_${r.status}`);
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const user = await creatorFromRequest(req);
    if (!user) return res.status(403).json({ error: 'creator_only' });
    const [revenue, withdrawals] = await Promise.all([
      rest('revenue_events?select=id,amount,currency,status,source,created_at&order=created_at.desc&limit=100'),
      rest('withdrawal_requests?select=id,amount,currency,status,destination_label,created_at,processed_at&order=created_at.desc&limit=50')
    ]);
    const approved = revenue.filter(x => x.status === 'approved');
    const gross = approved.reduce((s, x) => s + Number(x.amount || 0), 0);
    const requested = withdrawals.filter(x => ['requested','processing','paid'].includes(x.status)).reduce((s, x) => s + Number(x.amount || 0), 0);
    const paid = withdrawals.filter(x => x.status === 'paid').reduce((s, x) => s + Number(x.amount || 0), 0);
    return res.status(200).json({ creator: { id: user.id, label: 'Wayne Corporation' }, metrics: { gross, requested, paid, available: Math.max(0, gross - requested) }, revenue, withdrawals });
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: 'admin_backend_unavailable', detail: String(e.message || e) });
  }
};
