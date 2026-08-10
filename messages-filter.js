(() => {
  'use strict';

  if (window.__possivelMessagesFilter) return;
  window.__possivelMessagesFilter = true;

  const RECIPIENTS_ID = 'messageRecipients';
  let observer = null;
  let timer = null;
  let running = false;

  const getDb = () => window.POSSIVEL_DB || null;
  const getRecipients = () => document.getElementById(RECIPIENTS_ID);

  function schedule(delay = 80) {
    clearTimeout(timer);
    timer = setTimeout(() => void filterRecipients(), delay);
  }

  function attachObserver() {
    const recipients = getRecipients();
    if (!recipients) return false;

    observer?.disconnect();
    observer = new MutationObserver(() => schedule());
    observer.observe(recipients, { childList: true });
    return true;
  }

  async function filterRecipients() {
    if (running) return;
    const db = getDb();
    const recipients = getRecipients();
    if (!db || !recipients) return;

    running = true;
    try {
      const { data: { session }, error: sessionError } = await db.auth.getSession();
      if (sessionError || !session?.user) return;

      const userId = session.user.id;
      const { data: messages, error: messagesError } = await db
        .from('messages')
        .select('sender_id,receiver_id,created_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (messagesError) {
        console.error('message recipients:', messagesError);
        return;
      }

      const lastMessageAt = new Map();
      for (const message of messages || []) {
        const otherId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        if (otherId && !lastMessageAt.has(otherId)) lastMessageAt.set(otherId, message.created_at || '');
      }

      const conversationIds = [...lastMessageAt.keys()];
      observer?.disconnect();

      if (!conversationIds.length) {
        recipients.innerHTML = '<div class="empty-state">Nenhuma conversa ainda. Envie uma mensagem pelo perfil de alguém para começar.</div>';
        return;
      }

      const { data: profiles, error: profilesError } = await db
        .from('profiles')
        .select('id,name,handle')
        .in('id', conversationIds);

      if (profilesError) {
        console.error('message recipient profiles:', profilesError);
        return;
      }

      const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const existingButtons = [...recipients.querySelectorAll('button.recipient')];
      const buttonByHandle = new Map();
      for (const button of existingButtons) {
        const match = button.textContent?.match(/@([^\s·]+)/);
        if (match?.[1]) buttonByHandle.set(match[1], button);
      }

      const orderedIds = conversationIds.sort((a, b) => {
        const aTime = new Date(lastMessageAt.get(a) || 0).getTime();
        const bTime = new Date(lastMessageAt.get(b) || 0).getTime();
        return bTime - aTime;
      });

      const allowedButtons = orderedIds
        .map((id) => profileById.get(id))
        .filter(Boolean)
        .map((profile) => buttonByHandle.get(profile.handle))
        .filter(Boolean);

      if (allowedButtons.length) {
        recipients.replaceChildren(...allowedButtons);
      } else if (!existingButtons.length) {
        recipients.innerHTML = '<div class="empty-state">Carregando suas conversas...</div>';
      }
    } catch (error) {
      console.error('message recipients filter:', error);
    } finally {
      running = false;
      attachObserver();
    }
  }

  function init() {
    if (!attachObserver()) {
      setTimeout(init, 250);
      return;
    }

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-view="messages"], [data-view-link="messages"]') : null;
      if (target) schedule(180);
    }, true);

    document.getElementById('messageForm')?.addEventListener('submit', () => schedule(700), true);
    schedule(250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
