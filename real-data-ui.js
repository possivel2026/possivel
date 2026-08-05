(() => {
  const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

  function formatDate() {
    const el = document.querySelector('#welcomeDate');
    if (!el) return;
    el.textContent = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(new Date());
  }

  function updateGreeting() {
    const greeting = document.querySelector('#welcomeGreeting');
    const composerAvatar = document.querySelector('#composerAvatar');
    const profileName = document.querySelector('#profileName');
    const profileAvatar = document.querySelector('#profileAvatar');
    if (!greeting || !profileName) return;

    const name = profileName.textContent.trim();
    const loggedIn = name && name.toLowerCase() !== 'visitante';
    const firstName = loggedIn ? capitalize(name.split(/\s+/)[0]) : 'visitante';
    greeting.textContent = loggedIn ? `Olá, ${firstName}.` : 'Olá, visitante.';

    if (composerAvatar && profileAvatar) {
      composerAvatar.textContent = profileAvatar.textContent;
    }
  }

  function syncEmptyStates() {
    const feed = document.querySelector('#feedList');
    const feedEmpty = document.querySelector('#feedEmptyState');
    if (feed && feedEmpty) {
      const hasPosts = Boolean(feed.querySelector('.post'));
      feedEmpty.hidden = hasPosts;
    }

    const market = document.querySelector('#marketItems');
    const marketEmpty = document.querySelector('#marketEmptyState');
    if (market && marketEmpty) {
      const hasListings = Boolean(market.querySelector('.market-item'));
      marketEmpty.hidden = hasListings;
    }
  }

  async function loadRealPeople() {
    const container = document.querySelector('#peopleList');
    if (!container) return;

    if (!window.supabase || !window.POSSIVEL_SUPABASE?.url || !window.POSSIVEL_SUPABASE?.anonKey) {
      container.innerHTML = '<p class="empty-comments">Nenhuma pessoa para mostrar.</p>';
      return;
    }

    try {
      const client = window.supabase.createClient(
        window.POSSIVEL_SUPABASE.url,
        window.POSSIVEL_SUPABASE.anonKey
      );
      const { data: userData } = await client.auth.getUser();
      let query = client.from('profiles').select('id, name, handle').order('created_at', { ascending: false }).limit(5);
      if (userData?.user?.id) query = query.neq('id', userData.user.id);
      const { data, error } = await query;
      if (error) throw error;

      if (!data?.length) {
        container.innerHTML = '<p class="empty-comments">Ainda não há outras pessoas cadastradas.</p>';
        return;
      }

      container.innerHTML = '';
      data.forEach((profile) => {
        const initials = String(profile.name || 'Pessoa')
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const item = document.createElement('div');
        item.className = 'person';
        item.innerHTML = `<div class="avatar avatar-coral">${initials}</div><div><strong></strong><small></small></div>`;
        item.querySelector('strong').textContent = profile.name || 'Pessoa possível';
        item.querySelector('small').textContent = `@${profile.handle || 'possivel'}`;
        container.append(item);
      });
    } catch (error) {
      container.innerHTML = '<p class="empty-comments">Não foi possível carregar pessoas agora.</p>';
      console.error('Erro ao carregar perfis reais:', error);
    }
  }

  formatDate();
  updateGreeting();
  syncEmptyStates();
  loadRealPeople();

  const observer = new MutationObserver(() => {
    updateGreeting();
    syncEmptyStates();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
