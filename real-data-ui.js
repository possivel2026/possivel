(() => {
  const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
  const setText = (element, value) => {
    if (element && element.textContent !== value) element.textContent = value;
  };

  function formatDate() {
    const element = document.querySelector('#welcomeDate');
    if (!element) return;
    const value = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(new Date());
    setText(element, value);
  }

  function updateGreeting() {
    const greeting = document.querySelector('#welcomeGreeting');
    const composerAvatar = document.querySelector('#composerAvatar');
    const profileName = document.querySelector('#profileName');
    const profileAvatar = document.querySelector('#profileAvatar');
    if (!greeting || !profileName) return;

    const name = profileName.textContent.trim();
    const loggedIn = Boolean(name && name.toLowerCase() !== 'visitante');
    const firstName = loggedIn ? capitalize(name.split(/\s+/)[0]) : 'visitante';
    setText(greeting, loggedIn ? `Olá, ${firstName}.` : 'Olá, visitante.');

    if (composerAvatar && profileAvatar) {
      setText(composerAvatar, profileAvatar.textContent.trim() || 'VP');
    }
  }

  function syncEmptyStates() {
    const feed = document.querySelector('#feedList');
    const feedEmpty = document.querySelector('#feedEmptyState');
    if (feed && feedEmpty) feedEmpty.hidden = Boolean(feed.querySelector('.post'));

    const market = document.querySelector('#marketItems');
    const marketEmpty = document.querySelector('#marketEmptyState');
    if (market && marketEmpty) marketEmpty.hidden = Boolean(market.querySelector('.market-item'));
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
        item.innerHTML = '<div class="avatar avatar-coral"></div><div><strong></strong><small></small></div>';
        setText(item.querySelector('.avatar'), initials);
        setText(item.querySelector('strong'), profile.name || 'Pessoa possível');
        setText(item.querySelector('small'), `@${profile.handle || 'possivel'}`);
        container.append(item);
      });
    } catch (error) {
      container.innerHTML = '<p class="empty-comments">Não foi possível carregar pessoas agora.</p>';
      console.error('Erro ao carregar perfis reais:', error);
    }
  }

  function observeChanges() {
    const profileName = document.querySelector('#profileName');
    const feed = document.querySelector('#feedList');
    const market = document.querySelector('#marketItems');

    if (profileName) {
      new MutationObserver(updateGreeting).observe(profileName, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    [feed, market].filter(Boolean).forEach((element) => {
      new MutationObserver(syncEmptyStates).observe(element, {
        childList: true,
        subtree: true
      });
    });
  }

  formatDate();
  updateGreeting();
  syncEmptyStates();
  loadRealPeople();
  observeChanges();
})();
