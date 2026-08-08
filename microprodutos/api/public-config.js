module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  return res.status(200).json({
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
    configured: Boolean(url && anonKey),
    creatorLabel: 'Wayne Corporation'
  });
};
