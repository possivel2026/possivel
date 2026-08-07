(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.POSSIVEL_SUPABASE || {};
  const supabaseReady = Boolean(window.supabase && config.url && config.anonKey);
  const db = supabaseReady ? window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  const state = {
    session: null,
    user: null,
    profile: null,
    posts: [],
    profiles: [],
    listings: [],
    causes: [],
    follows: new Set(),
    plan: 'free',
    activePostId: null,
    activeRecipient: null,
    paymentContext: null,
    callMode: 'video',
    callRecipientId: null,
    callStream: null,
    channels: [],
    likeLocks: new Set(),
    search: ''
  };

  let toastTimer;

  const elements = {
    appStatus: $('#appStatus'),
    toast: $('#toast'),
    sidebar: $('.sidebar'),
    profileName: $('#profileName'),
    profileHandle: $('#profileHandle'),
    profileAvatar: $('#profileAvatar'),
    composerAvatar: $('#composerAvatar'),
    welcomeGreeting: $('#welcomeGreeting'),
    accountButton: $('#accountButton'),
    feedList: $('#feedList'),
    connectionsList: $('#connectionsList'),
    peoplePreview: $('#peoplePreview'),
    marketList: $('#marketList'),
    marketPreview: $('#marketPreview'),
    causesList: $('#causesList'),
    impactStats: $('#impactStats'),
    recipients: $('#messageRecipients'),
    messageThread: $('#messageThread'),
    threadHeader: $('#threadHeader'),
    notificationsList: $('#notificationsList')
  };

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 3200);
  }

  function showStatus(message, isError = true) {
    elements.appStatus.hidden = !message;
    elements.appStatus.textContent = message || '';
    elements.appStatus.style.background = isError ? '#7b2d26' : '#28633d';
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    $$('dialog[open]').forEach((item) => item !== dialog && item.close());
    dialog.showModal();
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function setBusy(button, busy, label = 'Aguarde...') {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = label;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function initials(name = 'Visitante') {
    return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'VP';
  }

  function formatRelative(dateString) {
    const date = new Date(dateString);
    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (seconds < 60) return formatter.format(-seconds, 'second');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return formatter.format(-minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return formatter.format(-hours, 'hour');
    const days = Math.floor(hours / 24);
    if (days < 30) return formatter.format(-days, 'day');
    return date.toLocaleDateString('pt-BR');
  }

  function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  function currentPageUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function requireAuth(message = 'Entre para continuar.') {
    if (state.user) return true;
    openAuth('login');
    showToast(message);
    return false;
  }

  function showView(name) {
    $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.viewPanel === name));
    $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
    elements.sidebar.classList.remove('open');
    if (name === 'messages') loadMessageRecipients();
    if (name === 'connections') renderConnections();
    if (name === 'market') renderListings();
    if (name === 'causes') renderCauses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateAuthUI() {
    const name = state.profile?.name || 'visitante';
    const handle = state.profile?.handle ? `@${state.profile.handle}` : '@possivel';
    const avatarText = initials(name);
    elements.profileName.textContent = name;
    elements.profileHandle.textContent = handle;
    elements.profileAvatar.textContent = avatarText;
    elements.composerAvatar.textContent = avatarText;
    elements.welcomeGreeting.textContent = state.user ? `Olá, ${name.split(/\s+/)[0]}.` : 'Olá, visitante.';
    elements.accountButton.textContent = state.user ? 'Sair' : 'Entrar';
    $('#currentPlanBadge').textContent = state.plan === 'pro' ? 'Possível Pro' : 'Free';
  }

  async function applySession(session) {
    state.session = session;
    state.user = session?.user || null;
    state.profile = null;
    state.follows.clear();
    state.plan = 'free';
    if (state.user) {
      await Promise.all([loadCurrentProfile(), loadPlan(), loadFollows()]);
    }
    updateAuthUI();
    await Promise.all([loadPosts(), loadProfiles(), loadListings(), loadCauses()]);
    if (state.user) await Promise.all([loadNotifications(), loadImpact()]);
    else {
      elements.impactStats.innerHTML = '<div class="empty-state">Entre para acompanhar seu impacto.</div>';
      updateNotificationBadge(0);
    }
    subscribeRealtime();
  }

  async function loadCurrentProfile() {
    const { data, error } = await db.from('profiles').select('id,name,handle,bio,avatar_url,created_at').eq('id', state.user.id).maybeSingle();
    if (error) {
      console.error('profile:', error);
      showStatus('O perfil não pôde ser carregado. Execute o supabase-schema.sql atualizado.', true);
      return;
    }
    if (data) {
      state.profile = data;
      return;
    }
    const fallback = {
      id: state.user.id,
      name: state.user.user_metadata?.name || 'Pessoa possível',
      handle: String(state.user.user_metadata?.handle || `usuario_${state.user.id.slice(0, 8)}`).toLowerCase()
    };
    const created = await db.from('profiles').upsert(fallback).select('id,name,handle,bio,avatar_url,created_at').single();
    if (!created.error) state.profile = created.data;
  }

  async function loadPlan() {
    try {
      const { data, error } = await db.rpc('get_effective_plan', { p_user_id: state.user.id });
      if (!error) state.plan = typeof data === 'string' ? data : data?.plan || 'free';
    } catch (error) {
      console.warn('Plano Pro ainda não migrado:', error);
    }
    $('#proPrice').textContent = config.proPriceLabel || 'Assinatura mensal';
  }

  function openAuth(mode = 'login') {
    const signup = mode === 'signup';
    $('#authTitle').textContent = signup ? 'Criar conta' : 'Entrar';
    $('#authSubmit').textContent = signup ? 'Criar conta' : 'Entrar';
    $('#signupFields').hidden = !signup;
    $('#authName').required = signup;
    $('#authHandle').required = signup;
    $('#authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('#authForm').dataset.mode = mode;
    $('#authError').textContent = '';
    $$('[data-auth-mode]').forEach((button) => button.classList.toggle('active', button.dataset.authMode === mode));
    openDialog($('#authDialog'));
  }

  async function submitAuth(event) {
    event.preventDefault();
    if (!db) return;
    const form = event.currentTarget;
    const button = $('#authSubmit');
    const mode = form.dataset.mode || 'login';
    const email = $('#authEmail').value.trim().toLowerCase();
    const password = $('#authPassword').value;
    const errorBox = $('#authError');
    errorBox.textContent = '';
    setBusy(button, true);
    try {
      if (mode === 'signup') {
        const name = $('#authName').value.trim();
        const handle = $('#authHandle').value.trim().toLowerCase();
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: { data: { name, handle }, emailRedirectTo: currentPageUrl() }
        });
        if (error) throw error;
        closeDialog($('#authDialog'));
        form.reset();
        showToast(data.session ? 'Conta criada e conectada.' : 'Conta criada. Confirme o e-mail para entrar.');
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        closeDialog($('#authDialog'));
        form.reset();
        showToast('Login realizado.');
      }
    } catch (error) {
      console.error('auth:', error);
      const message = String(error.message || 'Não foi possível autenticar.');
      errorBox.textContent = message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : message;
    } finally {
      setBusy(button, false);
    }
  }

  async function recoverPassword() {
    const email = $('#authEmail').value.trim().toLowerCase();
    if (!email) {
      $('#authError').textContent = 'Digite seu e-mail primeiro.';
      return;
    }
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: currentPageUrl() });
    $('#authError').textContent = error ? error.message : 'Enviamos um link de recuperação para seu e-mail.';
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    const password = $('#newPassword').value;
    const { error } = await db.auth.updateUser({ password });
    if (error) {
      $('#resetPasswordError').textContent = error.message;
      return;
    }
    closeDialog($('#resetPasswordDialog'));
    event.currentTarget.reset();
    showToast('Senha atualizada.');
  }

  function openProfile() {
    if (!requireAuth()) return;
    $('#profileEditName').value = state.profile?.name || '';
    $('#profileEditHandle').value = state.profile?.handle || '';
    $('#profileEditBio').value = state.profile?.bio || '';
    $('#profileError').textContent = '';
    openDialog($('#profileDialog'));
  }

  async function uploadFile(file, folder = 'posts') {
    if (!file) return null;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) throw new Error('Formato de arquivo não permitido.');
    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) throw new Error(isVideo ? 'O vídeo deve ter no máximo 100 MB.' : 'A imagem deve ter no máximo 10 MB.');
    const extension = (file.name.split('.').pop() || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase();
    const path = `${state.user.id}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await db.storage.from('posts-media').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return { url: db.storage.from('posts-media').getPublicUrl(path).data.publicUrl, type: file.type, path };
  }

  async function saveProfile(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Salvando...');
    $('#profileError').textContent = '';
    try {
      const avatarFile = $('#profileAvatarFile').files[0];
      const avatar = avatarFile ? await uploadFile(avatarFile, 'avatars') : null;
      const updates = {
        name: $('#profileEditName').value.trim(),
        handle: $('#profileEditHandle').value.trim().toLowerCase(),
        bio: $('#profileEditBio').value.trim()
      };
      if (avatar) updates.avatar_url = avatar.url;
      const { data, error } = await db.from('profiles').update(updates).eq('id', state.user.id).select('id,name,handle,bio,avatar_url,created_at').single();
      if (error) throw error;
      state.profile = data;
      updateAuthUI();
      closeDialog($('#profileDialog'));
      showToast('Perfil atualizado.');
      await Promise.all([loadPosts(), loadProfiles()]);
    } catch (error) {
      console.error('save profile:', error);
      $('#profileError').textContent = String(error.message || '').includes('duplicate') ? 'Este @usuário já está em uso.' : error.message;
    } finally {
      setBusy(button, false);
    }
  }

  async function loadPosts() {
    if (!db) return;
    elements.feedList.innerHTML = '<div class="empty-state">Carregando publicações...</div>';
    const { data, error } = await db.from('posts').select('id,author_id,body,kind,media_url,media_type,created_at,profiles(name,handle,avatar_url)').order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.error('posts:', error);
      elements.feedList.innerHTML = '<div class="empty-state">Não foi possível carregar o feed.</div>';
      return;
    }
    const posts = data || [];
    const ids = posts.map((post) => post.id);
    let likes = [];
    let comments = [];
    if (ids.length) {
      const [likesResult, commentsResult] = await Promise.all([
        db.from('post_likes').select('post_id,user_id').in('post_id', ids),
        db.from('comments').select('id,post_id').in('post_id', ids)
      ]);
      likes = likesResult.data || [];
      comments = commentsResult.data || [];
    }
    const likeCount = new Map();
    const commentCount = new Map();
    likes.forEach((item) => likeCount.set(item.post_id, (likeCount.get(item.post_id) || 0) + 1));
    comments.forEach((item) => commentCount.set(item.post_id, (commentCount.get(item.post_id) || 0) + 1));
    state.posts = posts.map((post) => ({
      ...post,
      likes: likeCount.get(post.id) || 0,
      comments: commentCount.get(post.id) || 0,
      liked: Boolean(state.user && likes.some((item) => item.post_id === post.id && item.user_id === state.user.id))
    }));
    renderPosts();
  }

  function renderPosts() {
    elements.feedList.innerHTML = '';
    let posts = [...state.posts];
    const sort = $('#feedSort').value;
    if (sort === 'popular') posts.sort((a, b) => b.likes - a.likes);
    if (sort === 'commented') posts.sort((a, b) => b.comments - a.comments);
    if (state.search) posts = posts.filter((post) => `${post.body} ${post.profiles?.name || ''} ${post.profiles?.handle || ''}`.toLowerCase().includes(state.search));
    if (!posts.length) {
      elements.feedList.innerHTML = `<div class="empty-state">${state.search ? 'Nenhuma publicação encontrada.' : 'Ainda não há publicações. Seja a primeira pessoa a publicar.'}</div>`;
      return;
    }
    posts.forEach((post) => elements.feedList.append(createPostCard(post)));
  }

  function createPostCard(post) {
    const article = document.createElement('article');
    article.className = 'post';
    article.dataset.postId = post.id;
    const head = document.createElement('header');
    head.className = 'post-head';
    const avatar = textElement('span', 'avatar', initials(post.profiles?.name));
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(textElement('strong', '', post.profiles?.name || 'Pessoa possível'));
    meta.append(textElement('small', '', `@${post.profiles?.handle || 'possivel'} · ${formatRelative(post.created_at)}`));
    const menu = textElement('button', 'post-menu', '•••');
    menu.type = 'button';
    menu.addEventListener('click', () => openPostMenu(post));
    head.append(avatar, meta, menu);
    article.append(head, textElement('p', 'post-body', post.body));
    if (post.media_url) {
      const media = document.createElement(post.media_type?.startsWith('video/') ? 'video' : 'img');
      media.className = 'post-media';
      media.src = post.media_url;
      if (media.tagName === 'VIDEO') media.controls = true;
      else media.alt = `Imagem publicada por ${post.profiles?.name || 'usuário'}`;
      article.append(media);
    }
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    const like = textElement('button', post.liked ? 'liked' : '', `${post.liked ? '♥' : '♡'} ${post.likes}`);
    like.type = 'button';
    like.addEventListener('click', () => toggleLike(post.id, like));
    const comments = textElement('button', '', `◌ ${post.comments} comentários`);
    comments.type = 'button';
    comments.addEventListener('click', () => openComments(post.id));
    const share = textElement('button', '', '↗ Compartilhar');
    share.type = 'button';
    share.addEventListener('click', () => sharePost(post));
    actions.append(like, comments, share);
    article.append(actions);
    return article;
  }

  function openPostMenu(post) {
    if (state.user?.id === post.author_id) {
      if (confirm('Apagar esta publicação?')) deletePost(post.id);
    } else {
      if (!requireAuth('Entre para denunciar conteúdo.')) return;
      state.activePostId = post.id;
      $('#reportError').textContent = '';
      openDialog($('#reportDialog'));
    }
  }

  async function deletePost(postId) {
    const { error } = await db.from('posts').delete().eq('id', postId).eq('author_id', state.user.id);
    if (error) return showToast('Não foi possível apagar a publicação.');
    showToast('Publicação apagada.');
    await Promise.all([loadPosts(), loadImpact()]);
  }

  async function sharePost(post) {
    const text = `${post.profiles?.name || 'Pessoa'} no Possível: ${post.body}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Possível', text, url: window.location.href });
      else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        showToast('Link copiado.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Não foi possível compartilhar.');
    }
  }

  async function toggleLike(postId, button) {
    if (!requireAuth('Entre para curtir.')) return;
    if (state.likeLocks.has(postId)) return;
    state.likeLocks.add(postId);
    button.disabled = true;
    try {
      const current = state.posts.find((post) => post.id === postId);
      const result = current?.liked
        ? await db.from('post_likes').delete().eq('post_id', postId).eq('user_id', state.user.id)
        : await db.from('post_likes').insert({ post_id: postId, user_id: state.user.id });
      if (result.error) throw result.error;
      const [countResult, likedResult] = await Promise.all([
        db.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
        db.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', state.user.id).maybeSingle()
      ]);
      current.likes = countResult.count || 0;
      current.liked = Boolean(likedResult.data);
      button.textContent = `${current.liked ? '♥' : '♡'} ${current.likes}`;
      button.classList.toggle('liked', current.liked);
    } catch (error) {
      console.error('like:', error);
      showToast('Não foi possível atualizar a curtida.');
    } finally {
      state.likeLocks.delete(postId);
      button.disabled = false;
    }
  }

  function openComposer(type = 'post') {
    if (!requireAuth('Entre para publicar.')) return;
    $('#composeForm').reset();
    $('#composeError').textContent = '';
    $('#mediaPreview').innerHTML = '';
    if (type === 'video') $('#mediaInput').accept = 'video/mp4,video/webm';
    else if (type === 'image') $('#mediaInput').accept = 'image/jpeg,image/png,image/webp';
    else $('#mediaInput').accept = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
    openDialog($('#composeDialog'));
    if (type === 'image' || type === 'video') $('#mediaInput').click();
  }

  async function submitPost(event) {
    event.preventDefault();
    const button = $('#publishButton');
    setBusy(button, true, 'Publicando...');
    $('#composeError').textContent = '';
    try {
      const body = $('#composeText').value.trim();
      const file = $('#mediaInput').files[0];
      const media = file ? await uploadFile(file, 'posts') : null;
      const { error } = await db.from('posts').insert({
        author_id: state.user.id,
        body,
        kind: file?.type.startsWith('video/') ? 'Vídeo' : file ? 'Foto' : 'Post',
        media_url: media?.url || null,
        media_type: media?.type || null
      });
      if (error) throw error;
      closeDialog($('#composeDialog'));
      event.currentTarget.reset();
      $('#mediaPreview').innerHTML = '';
      showToast('Publicado.');
      await Promise.all([loadPosts(), loadImpact()]);
    } catch (error) {
      console.error('post:', error);
      $('#composeError').textContent = error.message || 'Não foi possível publicar.';
    } finally {
      setBusy(button, false);
    }
  }

  async function openComments(postId) {
    state.activePostId = postId;
    $('#commentsList').innerHTML = '<div class="empty-state">Carregando...</div>';
    openDialog($('#commentsDialog'));
    await loadComments();
  }

  async function loadComments() {
    const { data, error } = await db.from('comments').select('id,author_id,body,created_at,profiles(name,handle)').eq('post_id', state.activePostId).order('created_at');
    const list = $('#commentsList');
    list.innerHTML = '';
    if (error) {
      console.error('comments:', error);
      list.innerHTML = '<div class="empty-state">Não foi possível carregar os comentários.</div>';
      return;
    }
    if (!data?.length) {
      list.innerHTML = '<div class="empty-state">Ainda não há comentários.</div>';
      return;
    }
    data.forEach((comment) => {
      const item = document.createElement('article');
      item.className = 'comment-item';
      item.append(textElement('strong', '', comment.profiles?.name || 'Pessoa possível'));
      item.append(textElement('small', '', ` @${comment.profiles?.handle || 'possivel'} · ${formatRelative(comment.created_at)}`));
      item.append(textElement('p', '', comment.body));
      if (comment.author_id === state.user?.id) {
        const remove = textElement('button', 'text-button', 'Apagar');
        remove.type = 'button';
        remove.addEventListener('click', () => deleteComment(comment.id));
        item.append(remove);
      }
      list.append(item);
    });
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!requireAuth('Entre para comentar.')) return;
    const body = $('#commentText').value.trim();
    const { error } = await db.from('comments').insert({ post_id: state.activePostId, author_id: state.user.id, body });
    if (error) return showToast('Não foi possível comentar.');
    event.currentTarget.reset();
    await Promise.all([loadComments(), refreshPostMetrics(state.activePostId), loadImpact()]);
  }

  async function deleteComment(commentId) {
    const { error } = await db.from('comments').delete().eq('id', commentId).eq('author_id', state.user.id);
    if (error) return showToast('Não foi possível apagar o comentário.');
    await Promise.all([loadComments(), refreshPostMetrics(state.activePostId), loadImpact()]);
  }

  async function refreshPostMetrics(postId) {
    const [likes, comments, liked] = await Promise.all([
      db.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
      db.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postId),
      state.user ? db.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', state.user.id).maybeSingle() : Promise.resolve({ data: null })
    ]);
    const post = state.posts.find((item) => item.id === postId);
    if (post) {
      post.likes = likes.count || 0;
      post.comments = comments.count || 0;
      post.liked = Boolean(liked.data);
      renderPosts();
    }
  }

  async function loadProfiles() {
    if (!db) return;
    const { data, error } = await db.from('profiles').select('id,name,handle,bio,avatar_url,created_at').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.error('profiles:', error);
      state.profiles = [];
    } else state.profiles = data || [];
    renderConnections();
    renderPeoplePreview();
  }

  async function loadFollows() {
    if (!state.user) return;
    const { data, error } = await db.from('follows').select('following_id').eq('follower_id', state.user.id);
    if (!error) state.follows = new Set((data || []).map((item) => item.following_id));
  }

  function filteredProfiles() {
    return state.profiles.filter((profile) => profile.id !== state.user?.id && (!state.search || `${profile.name} ${profile.handle} ${profile.bio || ''}`.toLowerCase().includes(state.search)));
  }

  function renderConnections() {
    elements.connectionsList.innerHTML = '';
    const profiles = filteredProfiles();
    if (!profiles.length) {
      elements.connectionsList.innerHTML = '<div class="empty-state">Ainda não há outras pessoas cadastradas.</div>';
      return;
    }
    profiles.forEach((profile) => elements.connectionsList.append(createPersonCard(profile)));
  }

  function renderPeoplePreview() {
    elements.peoplePreview.innerHTML = '';
    const profiles = filteredProfiles().slice(0, 3);
    if (!profiles.length) {
      elements.peoplePreview.innerHTML = '<div class="empty-state">Nenhuma pessoa para mostrar.</div>';
      return;
    }
    profiles.forEach((profile) => {
      const row = document.createElement('div');
      row.className = 'post-head';
      row.append(textElement('span', 'avatar', initials(profile.name)));
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.append(textElement('strong', '', profile.name));
      meta.append(textElement('small', '', `@${profile.handle}`));
      row.append(meta);
      elements.peoplePreview.append(row);
    });
  }

  function createPersonCard(profile) {
    const card = document.createElement('article');
    card.className = 'person-card';
    const header = document.createElement('header');
    header.append(textElement('span', 'avatar', initials(profile.name)));
    const meta = document.createElement('div');
    meta.append(textElement('strong', '', profile.name));
    meta.append(textElement('small', '', `@${profile.handle}`));
    header.append(meta);
    card.append(header, textElement('p', '', profile.bio || 'Sem bio ainda.'));
    const actions = document.createElement('div');
    actions.className = 'person-actions';
    const follow = textElement('button', state.follows.has(profile.id) ? 'secondary-button following' : 'secondary-button', state.follows.has(profile.id) ? 'Seguindo' : 'Seguir');
    follow.type = 'button';
    follow.addEventListener('click', () => toggleFollow(profile, follow));
    const message = textElement('button', 'primary-button', 'Mensagem');
    message.type = 'button';
    message.addEventListener('click', () => openConversation(profile));
    const call = textElement('button', 'secondary-button', 'Chamar');
    call.type = 'button';
    call.addEventListener('click', () => openCall(profile.id));
    actions.append(follow, message, call);
    card.append(actions);
    return card;
  }

  async function toggleFollow(profile, button) {
    if (!requireAuth('Entre para seguir pessoas.')) return;
    const following = state.follows.has(profile.id);
    setBusy(button, true);
    const result = following
      ? await db.from('follows').delete().eq('follower_id', state.user.id).eq('following_id', profile.id)
      : await db.from('follows').insert({ follower_id: state.user.id, following_id: profile.id });
    setBusy(button, false);
    if (result.error) return showToast('Não foi possível atualizar a conexão.');
    if (following) state.follows.delete(profile.id); else state.follows.add(profile.id);
    renderConnections();
    await loadImpact();
  }

  async function loadMessageRecipients() {
    if (!requireAuth('Entre para acessar mensagens.')) return;
    elements.recipients.innerHTML = '';
    const profiles = state.profiles.filter((profile) => profile.id !== state.user.id);
    if (!profiles.length) {
      elements.recipients.innerHTML = '<div class="empty-state">Nenhuma outra pessoa cadastrada.</div>';
      return;
    }
    profiles.forEach((profile) => {
      const button = textElement('button', `recipient${state.activeRecipient?.id === profile.id ? ' active' : ''}`, `${profile.name} · @${profile.handle}`);
      button.type = 'button';
      button.addEventListener('click', () => openConversation(profile));
      elements.recipients.append(button);
    });
    if (state.activeRecipient) await loadMessageThread();
  }

  async function openConversation(profile) {
    if (!requireAuth()) return;
    state.activeRecipient = profile;
    showView('messages');
    await loadMessageRecipients();
    await loadMessageThread();
  }

  async function loadMessageThread() {
    if (!state.activeRecipient) return;
    elements.threadHeader.textContent = `${state.activeRecipient.name} · @${state.activeRecipient.handle}`;
    elements.messageThread.innerHTML = '<div class="empty-state">Carregando conversa...</div>';
    const userId = state.user.id;
    const otherId = state.activeRecipient.id;
    const { data, error } = await db.from('messages').select('id,sender_id,receiver_id,body,created_at,read_at').or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`).order('created_at');
    elements.messageThread.innerHTML = '';
    if (error) {
      console.error('messages:', error);
      elements.messageThread.innerHTML = '<div class="empty-state">Não foi possível carregar a conversa.</div>';
      return;
    }
    if (!data?.length) elements.messageThread.innerHTML = '<div class="empty-state">Ainda não há mensagens. Diga oi.</div>';
    else data.forEach((message) => {
      const bubble = document.createElement('article');
      bubble.className = `message-bubble${message.sender_id === userId ? ' outgoing' : ''}`;
      bubble.append(textElement('div', '', message.body), textElement('small', '', new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })));
      elements.messageThread.append(bubble);
    });
    elements.messageThread.scrollTop = elements.messageThread.scrollHeight;
    await db.from('messages').update({ read_at: new Date().toISOString() }).eq('receiver_id', userId).eq('sender_id', otherId).is('read_at', null);
    await loadNotifications();
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!state.activeRecipient || !requireAuth()) return;
    const input = $('#messageText');
    const body = input.value.trim();
    if (!body) return;
    const { error } = await db.from('messages').insert({ sender_id: state.user.id, receiver_id: state.activeRecipient.id, body });
    if (error) return showToast('Não foi possível enviar a mensagem.');
    input.value = '';
    await loadMessageThread();
  }

  async function loadListings() {
    if (!db) return;
    const { data, error } = await db.from('listings').select('id,seller_id,title,description,listing_type,price,location,status,image_url,created_at,profiles(name,handle)').eq('status', 'active').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.error('listings:', error);
      state.listings = [];
    } else state.listings = data || [];
    renderListings();
    renderMarketPreview();
  }

  function filteredListings() {
    return state.listings.filter((listing) => !state.search || `${listing.title} ${listing.description} ${listing.location}`.toLowerCase().includes(state.search));
  }

  function renderListings() {
    elements.marketList.innerHTML = '';
    const listings = filteredListings();
    if (!listings.length) {
      elements.marketList.innerHTML = '<div class="empty-state">Ainda não há anúncios ativos.</div>';
      return;
    }
    listings.forEach((listing) => elements.marketList.append(createListingCard(listing)));
  }

  function renderMarketPreview() {
    elements.marketPreview.innerHTML = '';
    const listings = filteredListings().slice(0, 3);
    if (!listings.length) {
      elements.marketPreview.innerHTML = '<div class="empty-state">Ainda não há anúncios.</div>';
      return;
    }
    listings.forEach((listing) => {
      const row = document.createElement('p');
      row.append(textElement('strong', '', listing.title), document.createElement('br'), textElement('small', '', `${listing.listing_type === 'troca' ? 'Troca' : money(listing.price)} · ${listing.location}`));
      elements.marketPreview.append(row);
    });
  }

  function createListingCard(listing) {
    const card = document.createElement('article');
    card.className = 'listing-card';
    if (listing.image_url) {
      const image = document.createElement('img');
      image.src = listing.image_url;
      image.alt = listing.title;
      card.append(image);
    }
    card.append(textElement('p', 'section-kicker', listing.listing_type === 'troca' ? 'troca' : 'venda'));
    card.append(textElement('h2', '', listing.title));
    card.append(textElement('p', '', listing.description || 'Sem descrição.'));
    card.append(textElement('p', 'price', listing.listing_type === 'troca' ? 'Troca' : money(listing.price)));
    card.append(textElement('small', '', `${listing.location} · @${listing.profiles?.handle || 'possivel'}`));
    const actions = document.createElement('div');
    actions.className = 'person-actions';
    if (listing.seller_id === state.user?.id) {
      const sold = textElement('button', 'secondary-button', 'Marcar vendido');
      sold.type = 'button';
      sold.addEventListener('click', () => closeListing(listing.id));
      actions.append(sold);
    } else if (listing.listing_type === 'venda') {
      const buy = textElement('button', 'primary-button', 'Comprar');
      buy.type = 'button';
      buy.addEventListener('click', () => openPayment({ kind: 'purchase', listingId: listing.id, title: listing.title, amount: listing.price }));
      actions.append(buy);
    }
    card.append(actions);
    return card;
  }

  async function canCreateListing() {
    const limit = state.plan === 'pro' ? 50 : 5;
    const { count, error } = await db.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', state.user.id).eq('status', 'active');
    if (error) throw error;
    if ((count || 0) >= limit) {
      showView('plans');
      showToast(`Seu plano permite ${limit} anúncios ativos.`);
      return false;
    }
    return true;
  }

  async function openListingForm() {
    if (!requireAuth('Entre para publicar um anúncio.')) return;
    try {
      if (!(await canCreateListing())) return;
      $('#listingForm').reset();
      $('#listingError').textContent = '';
      openDialog($('#listingDialog'));
    } catch (error) {
      showToast('Não foi possível verificar o limite do plano.');
    }
  }

  async function submitListing(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Publicando...');
    $('#listingError').textContent = '';
    try {
      const file = $('#listingImage').files[0];
      const image = file ? await uploadFile(file, 'listings') : null;
      const type = $('#listingType').value;
      const { error } = await db.from('listings').insert({
        seller_id: state.user.id,
        title: $('#listingTitle').value.trim(),
        description: $('#listingDescription').value.trim(),
        listing_type: type,
        price: type === 'troca' ? null : Number($('#listingPrice').value || 0),
        location: $('#listingLocation').value.trim(),
        image_url: image?.url || null
      });
      if (error) throw error;
      closeDialog($('#listingDialog'));
      showToast('Anúncio publicado.');
      await Promise.all([loadListings(), loadImpact()]);
    } catch (error) {
      console.error('listing:', error);
      $('#listingError').textContent = error.message || 'Não foi possível publicar.';
    } finally {
      setBusy(button, false);
    }
  }

  async function closeListing(id) {
    const { error } = await db.from('listings').update({ status: 'sold' }).eq('id', id).eq('seller_id', state.user.id);
    if (error) return showToast('Não foi possível atualizar o anúncio.');
    await loadListings();
  }

  async function loadCauses() {
    if (!db) return;
    const { data, error } = await db.from('causes').select('id,creator_id,title,description,goal_amount,raised_amount,support_count,image_url,status,created_at,profiles(name,handle)').eq('status', 'active').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.error('causes:', error);
      state.causes = [];
    } else state.causes = data || [];
    renderCauses();
  }

  function renderCauses() {
    elements.causesList.innerHTML = '';
    const causes = state.causes.filter((cause) => !state.search || `${cause.title} ${cause.description}`.toLowerCase().includes(state.search));
    if (!causes.length) {
      elements.causesList.innerHTML = '<div class="empty-state">Ainda não há causas publicadas.</div>';
      return;
    }
    causes.forEach((cause) => {
      const card = document.createElement('article');
      card.className = 'cause-card';
      if (cause.image_url) {
        const image = document.createElement('img');
        image.src = cause.image_url;
        image.alt = cause.title;
        card.append(image);
      }
      card.append(textElement('p', 'section-kicker', `por @${cause.profiles?.handle || 'possivel'}`));
      card.append(textElement('h2', '', cause.title));
      card.append(textElement('p', '', cause.description));
      const percent = Math.min(100, Math.round((Number(cause.raised_amount || 0) / Math.max(1, Number(cause.goal_amount))) * 100));
      const progress = document.createElement('div');
      progress.className = 'progress';
      const bar = document.createElement('span');
      bar.style.width = `${percent}%`;
      progress.append(bar);
      card.append(progress, textElement('p', '', `${money(cause.raised_amount)} de ${money(cause.goal_amount)} · ${cause.support_count || 0} apoios`));
      const support = textElement('button', 'primary-button', 'Apoiar');
      support.type = 'button';
      support.addEventListener('click', () => openPayment({ kind: 'donation', causeId: cause.id, title: cause.title }));
      card.append(support);
      elements.causesList.append(card);
    });
  }

  function openCauseForm() {
    if (!requireAuth('Entre para criar uma causa.')) return;
    $('#causeForm').reset();
    $('#causeError').textContent = '';
    openDialog($('#causeDialog'));
  }

  async function submitCause(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Criando...');
    try {
      const file = $('#causeImage').files[0];
      const image = file ? await uploadFile(file, 'causes') : null;
      const { error } = await db.from('causes').insert({
        creator_id: state.user.id,
        title: $('#causeTitle').value.trim(),
        description: $('#causeDescription').value.trim(),
        goal_amount: Number($('#causeGoal').value),
        image_url: image?.url || null
      });
      if (error) throw error;
      closeDialog($('#causeDialog'));
      showToast('Causa criada.');
      await Promise.all([loadCauses(), loadImpact()]);
    } catch (error) {
      console.error('cause:', error);
      $('#causeError').textContent = error.message || 'Não foi possível criar a causa.';
    } finally {
      setBusy(button, false);
    }
  }

  function openPayment(context) {
    if (!requireAuth('Entre para continuar com o pagamento.')) return;
    state.paymentContext = context;
    $('#paymentTitle').textContent = context.kind === 'purchase' ? `Comprar ${context.title}` : `Apoiar ${context.title || 'uma causa'}`;
    $('#paymentAmount').value = context.amount || '';
    $('#paymentAmount').readOnly = context.kind === 'purchase';
    $('#paymentError').textContent = '';
    openDialog($('#paymentDialog'));
  }

  async function submitPayment(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Abrindo pagamento...');
    $('#paymentError').textContent = '';
    try {
      const amount = Number($('#paymentAmount').value);
      const provider = $('#paymentProvider').value;
      const context = state.paymentContext;
      const { data: payment, error } = await db.from('payments').insert({
        payer_id: state.user.id,
        listing_id: context.listingId || null,
        cause_id: context.causeId || null,
        kind: context.kind,
        amount,
        provider,
        purpose: context.title || 'Contribuição',
        status: 'pending'
      }).select('id').single();
      if (error) throw error;
      if (!config.paymentFunctionUrl) {
        closeDialog($('#paymentDialog'));
        showToast('Pedido registrado. Falta configurar a Edge Function de pagamento.');
        return;
      }
      const response = await fetch(config.paymentFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.session.access_token}` },
        body: JSON.stringify({ paymentId: payment.id })
      });
      const result = await response.json();
      if (!response.ok || !(result.checkout_url || result.checkoutUrl)) throw new Error(result.error || 'Checkout indisponível.');
      window.location.assign(result.checkout_url || result.checkoutUrl);
    } catch (error) {
      console.error('payment:', error);
      $('#paymentError').textContent = error.message || 'Não foi possível iniciar o pagamento.';
    } finally {
      setBusy(button, false);
    }
  }

  async function upgradePlan() {
    if (!requireAuth('Entre para assinar o Possível Pro.')) return;
    if (!config.checkoutFunctionUrl) return showToast('A Edge Function de assinatura ainda não foi configurada.');
    const button = $('#upgradeButton');
    setBusy(button, true, 'Abrindo checkout...');
    try {
      const response = await fetch(config.checkoutFunctionUrl, { method: 'POST', headers: { Authorization: `Bearer ${state.session.access_token}`, 'Content-Type': 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout indisponível.');
      const url = result.checkoutUrl || result.checkout_url || result.init_point;
      if (!url) throw new Error('O provedor não retornou a URL de pagamento.');
      window.location.assign(url);
    } catch (error) {
      showToast(error.message || 'Não foi possível abrir o checkout.');
    } finally {
      setBusy(button, false);
    }
  }

  async function loadNotifications() {
    if (!state.user) return;
    const { data, error } = await db.from('notifications').select('id,type,title,body,link,read_at,created_at').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.warn('notifications:', error);
      return;
    }
    const unread = (data || []).filter((item) => !item.read_at).length;
    updateNotificationBadge(unread);
    elements.notificationsList.innerHTML = '';
    if (!data?.length) {
      elements.notificationsList.innerHTML = '<div class="empty-state">Nenhuma notificação.</div>';
      return;
    }
    data.forEach((notification) => {
      const item = document.createElement('article');
      item.className = `notification-item${notification.read_at ? '' : ' unread'}`;
      item.append(textElement('strong', '', notification.title));
      item.append(textElement('p', '', notification.body || ''));
      item.append(textElement('small', '', formatRelative(notification.created_at)));
      elements.notificationsList.append(item);
    });
  }

  function updateNotificationBadge(count) {
    const badge = $('#notificationBadge');
    badge.hidden = !count;
    badge.textContent = count > 99 ? '99+' : String(count || '');
  }

  async function openNotifications() {
    if (!requireAuth()) return;
    await loadNotifications();
    openDialog($('#notificationsDialog'));
    await db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', state.user.id).is('read_at', null);
    updateNotificationBadge(0);
  }

  async function submitReport(event) {
    event.preventDefault();
    const { error } = await db.from('reports').insert({
      reporter_id: state.user.id,
      post_id: state.activePostId,
      reason: $('#reportReason').value,
      details: $('#reportDetails').value.trim()
    });
    if (error) {
      $('#reportError').textContent = 'Não foi possível enviar a denúncia.';
      return;
    }
    closeDialog($('#reportDialog'));
    event.currentTarget.reset();
    showToast('Denúncia enviada para análise.');
  }

  async function loadImpact() {
    if (!state.user) return;
    const userId = state.user.id;
    const [posts, comments, listings, follows, causes] = await Promise.all([
      db.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      db.from('comments').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      db.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
      db.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      db.from('causes').select('*', { count: 'exact', head: true }).eq('creator_id', userId)
    ]);
    const values = [
      ['publicações', posts.count || 0],
      ['comentários', comments.count || 0],
      ['anúncios', listings.count || 0],
      ['conexões', follows.count || 0],
      ['causas', causes.count || 0]
    ];
    elements.impactStats.innerHTML = '';
    values.forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'stat';
      card.append(textElement('strong', '', String(value)), textElement('span', '', label));
      elements.impactStats.append(card);
    });
  }

  async function openCall(recipientId = null) {
    if (!requireAuth('Entre para fazer chamadas.')) return;
    state.callRecipientId = recipientId;
    $('#callNote').textContent = 'Preparando câmera e microfone...';
    openDialog($('#callDialog'));
    try {
      state.callStream?.getTracks().forEach((track) => track.stop());
      state.callStream = await navigator.mediaDevices.getUserMedia({ video: state.callMode === 'video', audio: true });
      $('#localVideo').srcObject = state.callStream;
      $('#localVideo').hidden = state.callMode !== 'video';
      $('#callNote').textContent = config.callFunctionUrl ? 'Prévia pronta. Crie a sala para convidar a outra pessoa.' : 'Prévia pronta. Falta configurar LiveKit ou Daily na callFunctionUrl.';
    } catch (error) {
      $('#callNote').textContent = 'Não foi possível acessar câmera ou microfone. Confira as permissões.';
    }
  }

  function stopCallPreview() {
    state.callStream?.getTracks().forEach((track) => track.stop());
    state.callStream = null;
    $('#localVideo').srcObject = null;
  }

  async function startCall() {
    if (!config.callFunctionUrl) return showToast('Configure LiveKit ou Daily para chamadas reais.');
    const button = $('#startCallButton');
    setBusy(button, true, 'Criando sala...');
    try {
      const response = await fetch(config.callFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.session.access_token}` },
        body: JSON.stringify({ mode: state.callMode, recipientId: state.callRecipientId })
      });
      const result = await response.json();
      if (!response.ok || !(result.room_url || result.roomUrl)) throw new Error(result.error || 'Sala indisponível.');
      window.open(result.room_url || result.roomUrl, '_blank', 'noopener');
    } catch (error) {
      showToast(error.message || 'Não foi possível criar a sala.');
    } finally {
      setBusy(button, false);
    }
  }

  function subscribeRealtime() {
    state.channels.forEach((channel) => db.removeChannel(channel));
    state.channels = [];
    if (!state.user) return;
    const messages = db.channel(`messages-${state.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const message = payload.new;
      if (message.sender_id === state.user.id || message.receiver_id === state.user.id) {
        if (state.activeRecipient && (message.sender_id === state.activeRecipient.id || message.receiver_id === state.activeRecipient.id)) loadMessageThread();
        loadNotifications();
      }
    }).subscribe();
    const notifications = db.channel(`notifications-${state.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` }, () => loadNotifications()).subscribe();
    state.channels.push(messages, notifications);
  }

  function applySearch(value) {
    state.search = value.trim().toLowerCase();
    renderPosts();
    renderConnections();
    renderPeoplePreview();
    renderListings();
    renderMarketPreview();
    renderCauses();
  }

  function bindEvents() {
    $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
    $$('dialog').forEach((dialog) => dialog.addEventListener('close', () => { if (dialog.id === 'callDialog') stopCallPreview(); }));
    $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
    $$('[data-view-link]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.viewLink)));
    $('#mobileMenu').addEventListener('click', () => elements.sidebar.classList.toggle('open'));
    $('#searchInput').addEventListener('input', (event) => applySearch(event.target.value));
    $('#feedSort').addEventListener('change', renderPosts);
    $('#newButton').addEventListener('click', () => openComposer());
    $('#composerButton').addEventListener('click', () => openComposer());
    $$('[data-compose-media]').forEach((button) => button.addEventListener('click', () => openComposer(button.dataset.composeMedia)));
    $$('[data-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'message') showView('messages');
      if (action === 'video') openComposer('video');
      if (action === 'call') openCall();
      if (action === 'donation') showView('causes');
    }));
    $('#accountButton').addEventListener('click', async () => {
      if (!state.user) return openAuth('login');
      await db.auth.signOut();
      showToast('Você saiu da conta.');
    });
    $('#profileButton').addEventListener('click', openProfile);
    $('#notificationButton').addEventListener('click', openNotifications);
    $('#helpButton').addEventListener('click', () => showToast('Publique, conecte-se, converse, negocie e apoie causas reais.'));
    $$('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => openAuth(button.dataset.authMode)));
    $('#authForm').addEventListener('submit', submitAuth);
    $('#forgotPasswordButton').addEventListener('click', recoverPassword);
    $('#resetPasswordForm').addEventListener('submit', submitNewPassword);
    $('#profileForm').addEventListener('submit', saveProfile);
    $('#composeForm').addEventListener('submit', submitPost);
    $('#mediaInput').addEventListener('change', () => {
      const file = $('#mediaInput').files[0];
      const preview = $('#mediaPreview');
      preview.innerHTML = '';
      if (!file) return;
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      media.src = URL.createObjectURL(file);
      if (media.tagName === 'VIDEO') media.controls = true;
      preview.append(media);
    });
    $('#commentsForm').addEventListener('submit', submitComment);
    $('#messageForm').addEventListener('submit', sendMessage);
    $('#newListingButton').addEventListener('click', openListingForm);
    $('#listingForm').addEventListener('submit', submitListing);
    $('#listingType').addEventListener('change', () => { $('#listingPrice').disabled = $('#listingType').value === 'troca'; });
    $('#newCauseButton').addEventListener('click', openCauseForm);
    $('#causeForm').addEventListener('submit', submitCause);
    $('#paymentForm').addEventListener('submit', submitPayment);
    $('#upgradeButton').addEventListener('click', upgradePlan);
    $('#reportForm').addEventListener('submit', submitReport);
    $$('[data-call-mode]').forEach((button) => button.addEventListener('click', () => {
      state.callMode = button.dataset.callMode;
      $$('[data-call-mode]').forEach((item) => item.classList.toggle('active', item === button));
      if ($('#callDialog').open) openCall(state.callRecipientId);
    }));
    $('#startCallButton').addEventListener('click', startCall);
  }

  async function init() {
    bindEvents();
    $('#welcomeDate').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
    if (!supabaseReady) {
      showStatus('Supabase não configurado. Preencha a URL e a chave pública em supabase-config.js.', true);
      updateAuthUI();
      elements.feedList.innerHTML = '<div class="empty-state">Configure o Supabase para carregar dados reais.</div>';
      return;
    }
    showStatus('Conectando ao banco de dados...', false);
    try {
      const { data: { session }, error } = await db.auth.getSession();
      if (error) throw error;
      await applySession(session);
      showStatus('', false);
      db.auth.onAuthStateChange(async (event, sessionValue) => {
        if (event === 'PASSWORD_RECOVERY') openDialog($('#resetPasswordDialog'));
        await applySession(sessionValue);
      });
    } catch (error) {
      console.error('init:', error);
      showStatus('Não foi possível conectar ao Supabase. Verifique a configuração e o SQL.', true);
    }
  }

  init();
})();
