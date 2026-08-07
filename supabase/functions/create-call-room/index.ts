import { corsHeaders, json } from '../_shared/cors.ts';
import { userClient, admin } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const userDb = await userClient(req);
  const { data: { user }, error: userError } = await userDb.auth.getUser();
  if (userError || !user) return json({ error: 'Não autenticado' }, 401);

  const { mode = 'video', recipientId = null } = await req.json().catch(() => ({}));
  if (!['audio', 'video'].includes(mode)) return json({ error: 'Modo inválido' }, 400);

  const apiKey = Deno.env.get('DAILY_API_KEY');
  if (!apiKey) return json({ error: 'DAILY_API_KEY não configurada' }, 500);

  const roomName = `possivel-${crypto.randomUUID()}`;
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
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

  const db = admin();
  const { data: session, error: sessionError } = await db.from('call_sessions').insert({
    host_id: user.id,
    recipient_id: recipientId,
    provider: 'daily',
    room_name: roomName,
    mode,
    status: 'active',
  }).select('id').single();
  if (sessionError) return json({ error: sessionError.message }, 400);

  if (recipientId) {
    await db.from('notifications').insert({
      user_id: recipientId,
      actor_id: user.id,
      type: 'system',
      title: 'Convite para chamada',
      body: `Você recebeu um convite para uma chamada de ${mode === 'video' ? 'vídeo' : 'áudio'}.`,
      link: room.url,
    });
  }

  return json({ room_url: room.url, session_id: session.id, expires_at: expiresAt });
});
