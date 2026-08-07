import { corsHeaders, json } from '../_shared/cors.ts';
import { userClient, admin } from '../_shared/supabase.ts';

async function createMeetingToken(apiKey: string, properties: Record<string, unknown>) {
  const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  if (!data.token) throw new Error('Daily não retornou o token da reunião.');
  return String(data.token);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const userDb = await userClient(req);
  const { data: { user }, error: userError } = await userDb.auth.getUser();
  if (userError || !user) return json({ error: 'Não autenticado' }, 401);

  const { mode = 'video', recipientId = null } = await req.json().catch(() => ({}));
  if (!['audio', 'video'].includes(mode)) return json({ error: 'Modo inválido' }, 400);
  if (recipientId === user.id) return json({ error: 'Você não pode ligar para si mesmo' }, 400);

  const apiKey = Deno.env.get('DAILY_API_KEY');
  if (!apiKey) return json({ error: 'DAILY_API_KEY não configurada' }, 500);

  const db = admin();
  const { data: hostProfile } = await db.from('profiles').select('name').eq('id', user.id).maybeSingle();
  const { data: recipientProfile } = recipientId
    ? await db.from('profiles').select('name').eq('id', recipientId).maybeSingle()
    : { data: null };

  const roomName = `possivel-${crypto.randomUUID()}`;
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp: expiresAt,
        enable_chat: true,
        enable_screenshare: mode === 'video',
        start_video_off: mode === 'audio',
      },
    }),
  });

  if (!response.ok) return json({ error: await response.text() }, 502);
  const room = await response.json();

  try {
    const [hostToken, guestToken] = await Promise.all([
      createMeetingToken(apiKey, { room_name: roomName, exp: expiresAt, is_owner: true, user_id: user.id, user_name: hostProfile?.name ?? 'Anfitrião' }),
      recipientId
        ? createMeetingToken(apiKey, { room_name: roomName, exp: expiresAt, is_owner: false, user_id: recipientId, user_name: recipientProfile?.name ?? 'Convidado' })
        : Promise.resolve(null),
    ]);

    const { data: session, error: sessionError } = await db.from('call_sessions').insert({
      host_id: user.id,
      recipient_id: recipientId,
      provider: 'daily',
      room_name: roomName,
      mode,
      status: 'active',
    }).select('id').single();
    if (sessionError) return json({ error: sessionError.message }, 400);

    const hostUrl = `${room.url}?t=${encodeURIComponent(hostToken)}`;
    if (recipientId && guestToken) {
      const guestUrl = `${room.url}?t=${encodeURIComponent(guestToken)}`;
      await db.from('notifications').insert({
        user_id: recipientId,
        actor_id: user.id,
        type: 'system',
        title: 'Convite para chamada',
        body: `Você recebeu um convite para uma chamada de ${mode === 'video' ? 'vídeo' : 'áudio'}.`,
        link: guestUrl,
      });
    }

    return json({ room_url: hostUrl, session_id: session.id, expires_at: expiresAt });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao criar acesso à chamada' }, 502);
  }
});
