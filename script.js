const dialog = document.querySelector('#composeDialog');
const dialogTitle = document.querySelector('#dialogTitle');
const composeText = document.querySelector('#composeText');
const toast = document.querySelector('#toast');
const feedList = document.querySelector('#feedList');
const authDialog = document.querySelector('#authDialog');
const authForm = document.querySelector('#authForm');
const authTitle = document.querySelector('#authTitle');
const authSubmit = document.querySelector('#authSubmit');
const authError = document.querySelector('#authError');
const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');
const authName = document.querySelector('#authName');
const authHandle = document.querySelector('#authHandle');
const signupFields = document.querySelector('.signup-only');
const accountButton = document.querySelector('#accountButton');
const profileButton = document.querySelector('#profileButton');
const profileDialog = document.querySelector('#profileDialog');
const profileForm = document.querySelector('#profileForm');
const profileEditName = document.querySelector('#profileEditName');
const profileEditHandle = document.querySelector('#profileEditHandle');
const profileEditBio = document.querySelector('#profileEditBio');
const profileError = document.querySelector('#profileError');
const commentsDialog = document.querySelector('#commentsDialog');
const commentsForm = document.querySelector('#commentsForm');
const commentsList = document.querySelector('#commentsList');
const commentText = document.querySelector('#commentText');
const commentSubmit = document.querySelector('#commentSubmit');
const mediaInput = document.querySelector('#mediaInput');
const mediaPreview = document.querySelector('#mediaPreview');
const mediaPreviewContent = document.querySelector('#mediaPreviewContent');
const removeMedia = document.querySelector('#removeMedia');
const messagesDialog = document.querySelector('#messagesDialog');
const closeMessages = document.querySelector('#closeMessages');
const recipientSelect = document.querySelector('#recipientSelect');
const messageThread = document.querySelector('#messageThread');
const messageForm = document.querySelector('#messageForm');
const messageText = document.querySelector('#messageText');
const messageNote = document.querySelector('#messageNote');
const marketButton = document.querySelector('#marketButton');
const marketItems = document.querySelector('#marketItems');
const listingDialog = document.querySelector('#listingDialog');
const listingForm = document.querySelector('#listingForm');
const listingTitle = document.querySelector('#listingTitle');
const listingDescription = document.querySelector('#listingDescription');
const listingPrice = document.querySelector('#listingPrice');
const listingLocation = document.querySelector('#listingLocation');
const listingError = document.querySelector('#listingError');
const tradeOnly = document.querySelector('.trade-only');
const paymentDialog = document.querySelector('#paymentDialog');
const paymentForm = document.querySelector('#paymentForm');
const paymentKicker = document.querySelector('#paymentKicker');
const paymentTitle = document.querySelector('#paymentTitle');
const paymentAmount = document.querySelector('#paymentAmount');
const paymentPurpose = document.querySelector('#paymentPurpose');
const paymentMethod = document.querySelector('#paymentMethod');
const paymentError = document.querySelector('#paymentError');
const paymentSubmit = document.querySelector('#paymentSubmit');
const callDialog = document.querySelector('#callDialog');
const closeCall = document.querySelector('#closeCall');
const callTitle = document.querySelector('#callTitle');
const localVideo = document.querySelector('#localVideo');
const muteCall = document.querySelector('#muteCall');
const toggleCamera = document.querySelector('#toggleCamera');
const endCall = document.querySelector('#endCall');
const joinCall = document.querySelector('#joinCall');
const callNote = document.querySelector('#callNote');
const reportDialog = document.querySelector('#reportDialog');
const reportForm = document.querySelector('#reportForm');
const reportReason = document.querySelector('#reportReason');
const reportDetails = document.querySelector('#reportDetails');
const reportError = document.querySelector('#reportError');
let listingType = 'venda';
let paymentContext = { kind: 'donation', listingId: null };
let callMode = 'video';
let callStream = null;
let reportPostId = null;
let authMode = 'login';
let toastTimer;
let activePostId = null;
let selectedMedia = null;
let activeRecipient = null;
let messageChannel = null;
const supabaseReady = Boolean(window.supabase && window.POSSIVEL_SUPABASE?.url && window.POSSIVEL_SUPABASE?.anonKey);
const supabaseClient = supabaseReady ? window.supabase.createClient(window.POSSIVEL_SUPABASE.url, window.POSSIVEL_SUPABASE.anonKey) : null;

function closeDialog(dialogElement) {
  if (!dialogElement || !dialogElement.open) return;
  try {
    dialogElement.close();
  } catch (error) {
    dialogElement.removeAttribute('open');
  }
}

function closeAllDialogs(exceptDialog = null) {
  document.querySelectorAll('dialog').forEach((dialogElement) => {
    if (dialogElement !== exceptDialog && dialogElement.open) {
      closeDialog(dialogElement);
    }
  });
}

function openDialog(dialogElement) {
  if (!dialogElement) return;
  if (dialogElement.open) return;
  closeAllDialogs(dialogElement);
  try {
    dialogElement.showModal();
  } catch (error) {
    if (!dialogElement.open) {
      dialogElement.setAttribute('open', '');
    }
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem('possivel-users') || '[]');
}

function updateAuthUI() {
  const session = JSON.parse(localStorage.getItem('possivel-session') || 'null');
  const profileName = document.querySelector('#profileName');
  const profileHandle = document.querySelector('#profileHandle');
  const profileAvatar = document.querySelector('#profileAvatar');
  if (session) {
    accountButton.textContent = 'Sair';
    profileName.textContent = session.name;
    profileHandle.textContent = `@${session.handle}`;
    profileAvatar.textContent = session.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  } else {
    accountButton.textContent = 'Entrar';
    profileName.textContent = 'visitante';
    profileHandle.textContent = '@possivel';
    profileAvatar.textContent = 'VP';
  }
}

async function updateSupabaseAuthUI() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    let profile = (await supabaseClient.from('profiles').select('name, handle').eq('id', session.user.id).maybeSingle()).data;
    if (!profile) {
      const fallbackName = session.user.user_metadata?.name || 'Pessoa possível';
      const fallbackHandle = String(session.user.user_metadata?.handle || `usuario_${session.user.id.slice(0, 8)}`).toLowerCase();
      const { data: createdProfile, error } = await supabaseClient.from('profiles').insert({ id: session.user.id, name: fallbackName, handle: fallbackHandle }).select('name, handle').single();
      profile = error ? null : createdProfile;
    }
    localStorage.setItem('possivel-session', JSON.stringify({ name: profile?.name || session.user.user_metadata?.name || 'Pessoa possível', handle: profile?.handle || 'possivel', email: session.user.email }));
  } else {
    localStorage.removeItem('possivel-session');
  }
  updateAuthUI();
}

function openAuth(mode = 'login') {
  authMode = mode;
  authError.textContent = '';
  authForm.reset();
  document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.classList.toggle('active', tab.dataset.authMode === mode));
  const signup = mode === 'signup';
  authTitle.textContent = signup ? 'Crie seu espaço' : 'Entre para continuar';
  authSubmit.textContent = signup ? 'Criar minha conta' : 'Entrar';
  signupFields.hidden = !signup;
  authName.required = signup;
  authHandle.required = signup;
  openDialog(authDialog);
  authEmail.focus();
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const users = getUsers();
  if (supabaseClient) {
    handleSupabaseSubmit(email, password);
    return;
  }
  if (authMode === 'signup') {
    const name = authName.value.trim();
    const handle = authHandle.value.trim().toLowerCase();
    if (users.some((user) => user.email === email)) {
      authError.textContent = 'Este e-mail já possui uma conta.';
      return;
    }
    if (users.some((user) => user.handle === handle)) {
      authError.textContent = 'Este @ já está sendo usado.';
      return;
    }
    const user = { name, handle, email, password };
    localStorage.setItem('possivel-users', JSON.stringify([...users, user]));
    localStorage.setItem('possivel-session', JSON.stringify({ name, handle, email }));
    closeDialog(authDialog);
    updateAuthUI();
    showToast(`Bem-vinda, ${name.split(' ')[0]}. Sua conta foi criada.`);
    return;
  }
  const user = users.find((candidate) => candidate.email === email && candidate.password === password);
  if (!user) {
    authError.textContent = 'E-mail ou senha incorretos.';
    return;
  }
  localStorage.setItem('possivel-session', JSON.stringify({ name: user.name, handle: user.handle, email: user.email }));
  closeDialog(authDialog);
  updateAuthUI();
  showToast(`Que bom te ver, ${user.name.split(' ')[0]}.`);
}

async function handleSupabaseSubmit(email, password) {
  authError.textContent = '';
  if (authMode === 'signup') {
    const name = authName.value.trim();
    const handle = authHandle.value.trim().toLowerCase();
    const { error } = await supabaseClient.auth.signUp({ email, password, options: { data: { name, handle } } });
    if (error) {
      authError.textContent = error.message.includes('already registered') ? 'Este e-mail já possui uma conta.' : error.message;
      return;
    }
    closeDialog(authDialog);
    showToast('Conta criada. Verifique seu e-mail para confirmar o acesso.');
    return;
  }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    authError.textContent = 'E-mail ou senha incorretos.';
    return;
  }
  closeDialog(authDialog);
  await updateSupabaseAuthUI();
  showToast('Login realizado com sucesso.');
}

async function recoverPassword() {
  const email = authEmail.value.trim().toLowerCase();
  if (!email) {
    authError.textContent = 'Digite seu e-mail primeiro.';
    authEmail.focus();
    return;
  }
  if (!supabaseClient) {
    authError.textContent = 'Configure o Supabase para ativar a recuperação por e-mail.';
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  authError.textContent = error ? error.message : 'Enviamos um link de recuperação para seu e-mail.';
}

function getSession() {
  return JSON.parse(localStorage.getItem('possivel-session') || 'null');
}

async function getSupabaseUser() {
  if (!supabaseClient) return null;
  return (await supabaseClient.auth.getUser()).data.user;
}

function requireLogin() {
  if (supabaseClient) return true;
  if (getSession()) return true;
  openAuth('login');
  showToast('Entre para usar esta ação.');
  return false;
}

function makePostElement({ id, body, name, handle, kind = 'Post', likes = 0, comments = 0, mediaUrl = '', mediaType = '' }) {
  const post = document.createElement('article');
  post.className = 'post';
  post.dataset.postId = id;
  post.dataset.search = `${body} ${name} ${handle}`.toLowerCase();
  post.dataset.kind = kind;
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const media = mediaUrl ? (mediaType.startsWith('video/') ? `<video class="uploaded-media" src="${mediaUrl}" controls preload="metadata"></video>` : `<img class="uploaded-media" src="${mediaUrl}" alt="Imagem publicada por ${name}" />`) : '';
  post.innerHTML = `<div class="post-head"><div class="avatar avatar-lilac">${initials}</div><div class="post-author"><strong>${name}</strong><small>@${handle} · agora</small></div><button class="more-button">•••</button></div><p>${body.replace(/[<>]/g, '')}</p>${media}<div class="post-actions"><button class="like-button">♡ <span>${likes}</span></button><button class="comment-button">◌ <span>${comments} comentários</span></button><button>↗ <span>Compartilhar</span></button></div>`;
  attachLike(post.querySelector('.like-button'));
  applyLocalLikeState(post.querySelector('.like-button'), id);
  post.querySelector('.comment-button').addEventListener('click', () => openComments(id));
  post.querySelector('.more-button').addEventListener('click', () => openReport(id));
  return post;
}

function applyLocalLikeState(button, postId) {
  if (supabaseClient) return;
  const session = getSession();
  const likes = session ? JSON.parse(localStorage.getItem(`possivel-likes-${session.email}`) || '[]') : [];
  if (likes.includes(String(postId))) {
    button.classList.add('liked');
    button.firstChild.textContent = '♥ ';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

async function uploadMedia(file) {
  if (!file) return { url: '', type: '' };
  if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type)) throw new Error('Formato não suportado.');
  const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) throw new Error(file.type.startsWith('video/') ? 'O vídeo deve ter no máximo 100 MB.' : 'A imagem deve ter no máximo 10 MB.');
  if (!supabaseClient) return { url: await readFileAsDataUrl(file), type: file.type };
  const user = await getSupabaseUser();
  if (!user) return null;
  const extension = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseClient.storage.from('posts-media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('posts-media').getPublicUrl(path);
  return { url: data.publicUrl, type: file.type };
}

async function savePost(text, file) {
  const session = getSession();
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    if (!user) return null;
    const media = await uploadMedia(file);
    if (file && !media) return null;
    const { data, error } = await supabaseClient.from('posts').insert({ author_id: user.id, body: text, media_url: media?.url || null, media_type: media?.type || null }).select('id').single();
    if (error) throw error;
    return { id: data.id, mediaUrl: media?.url || '', mediaType: media?.type || '' };
  }
  if (!session) return null;
  const media = await uploadMedia(file);
  const post = { id: `local-${Date.now()}`, body: text, name: session.name, handle: session.handle, likes: 0, comments: 0, mediaUrl: media.url, mediaType: media.type };
  const posts = JSON.parse(localStorage.getItem('possivel-posts') || '[]');
  localStorage.setItem('possivel-posts', JSON.stringify([post, ...posts]));
  return { id: post.id, mediaUrl: post.mediaUrl, mediaType: post.mediaType };
}

async function toggleLike(postId, button) {
  if (!requireLogin()) return;
  if (supabaseClient) {
    const user = await getSupabaseUser();
    const { data: existing } = await supabaseClient.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    const result = existing ? await supabaseClient.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id) : await supabaseClient.from('post_likes').insert({ post_id: postId, user_id: user.id });
    if (result.error) { showToast('Não foi possível atualizar a curtida.'); return; }
  } else {
    const key = `possivel-likes-${getSession().email}`;
    const likes = JSON.parse(localStorage.getItem(key) || '[]');
    const index = likes.indexOf(postId);
    index >= 0 ? likes.splice(index, 1) : likes.push(postId);
    localStorage.setItem(key, JSON.stringify(likes));
  }
  const count = button.querySelector('span');
  const liked = button.classList.toggle('liked');
  count.textContent = Number(count.textContent) + (liked ? 1 : -1);
  button.firstChild.textContent = liked ? '♥ ' : '♡ ';
}

async function openComments(postId) {
  activePostId = postId;
  commentsList.innerHTML = '<p class="empty-comments">Carregando comentários...</p>';
  if (supabaseClient && !String(postId).startsWith('sample-')) {
    const { data, error } = await supabaseClient.from('comments').select('body, created_at, profiles(name, handle)').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) { commentsList.innerHTML = '<p class="empty-comments">Não foi possível carregar os comentários.</p>'; }
    else renderComments(data.map((comment) => ({ body: comment.body, name: comment.profiles?.name || 'Pessoa possível', handle: comment.profiles?.handle || 'possivel' })));
  } else {
    const comments = JSON.parse(localStorage.getItem('possivel-comments') || '{}');
    renderComments(comments[postId] || []);
  }
  openDialog(commentsDialog);
}

function renderComments(comments) {
  commentsList.innerHTML = comments.length ? comments.map((comment) => `<div class="comment-item"><strong>${comment.name}</strong><small>@${comment.handle}</small><p>${comment.body.replace(/[<>]/g, '')}</p></div>`).join('') : '<p class="empty-comments">Ainda não há comentários. Seja a primeira pessoa.</p>';
}

async function submitComment(event) {
  event.preventDefault();
  const body = commentText.value.trim();
  if (!body || !requireLogin()) return;
  const session = getSession();
  if (supabaseClient && !String(activePostId).startsWith('sample-')) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    const { error } = await supabaseClient.from('comments').insert({ post_id: activePostId, author_id: user.id, body });
    if (error) { showToast('Não foi possível comentar.'); return; }
  } else {
    const comments = JSON.parse(localStorage.getItem('possivel-comments') || '{}');
    comments[activePostId] = [...(comments[activePostId] || []), { body, name: session.name, handle: session.handle }];
    localStorage.setItem('possivel-comments', JSON.stringify(comments));
  }
  commentText.value = '';
  const post = document.querySelector(`[data-post-id="${activePostId}"]`);
  const commentCount = post?.querySelector('.comment-button span');
  if (commentCount) commentCount.textContent = `${Number(commentCount.textContent.split(' ')[0]) + 1} comentários`;
  openComments(activePostId);
  showToast('Comentário publicado.');
}

function openProfileEditor() {
  if (!requireLogin()) return;
  const session = getSession();
  profileError.textContent = '';
  profileEditName.value = session?.name || '';
  profileEditHandle.value = session?.handle || '';
  profileEditBio.value = session?.bio || '';
  openDialog(profileDialog);
}

async function saveProfile(event) {
  event.preventDefault();
  const name = profileEditName.value.trim();
  const handle = profileEditHandle.value.trim().toLowerCase();
  const bio = profileEditBio.value.trim();
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    const { error } = await supabaseClient.from('profiles').update({ name, handle, bio }).eq('id', user.id);
    if (error) { profileError.textContent = error.message.includes('duplicate') ? 'Este @ já está sendo usado.' : error.message; return; }
  } else {
    const users = getUsers();
    const session = getSession();
    if (users.some((user) => user.handle === handle && user.email !== session.email)) { profileError.textContent = 'Este @ já está sendo usado.'; return; }
    const updatedUsers = users.map((user) => user.email === session.email ? { ...user, name, handle, bio } : user);
    localStorage.setItem('possivel-users', JSON.stringify(updatedUsers));
    localStorage.setItem('possivel-session', JSON.stringify({ ...session, name, handle, bio }));
  }
  closeDialog(profileDialog);
  await updateSupabaseAuthUI();
  updateAuthUI();
  showToast('Perfil atualizado.');
}

async function loadPersistedPosts() {
  if (supabaseClient) {
    const { data } = await supabaseClient.from('posts').select('id, body, kind, media_url, media_type, created_at, profiles(name, handle)').order('created_at', { ascending: false }).limit(30);
    data?.reverse().forEach((post) => feedList.prepend(makePostElement({ id: post.id, body: post.body, kind: post.kind, mediaUrl: post.media_url || '', mediaType: post.media_type || '', name: post.profiles?.name || 'Pessoa possível', handle: post.profiles?.handle || 'possivel' })));
    return;
  }
  const posts = JSON.parse(localStorage.getItem('possivel-posts') || '[]');
  posts.slice().reverse().forEach((post) => feedList.prepend(makePostElement(post)));
}

async function openMessages() {
  if (!requireLogin()) return;
  await loadMessageRecipients();
  openDialog(messagesDialog);
  if (activeRecipient) await loadMessageThread();
  messageText.focus();
}

async function loadMessageRecipients() {
  recipientSelect.innerHTML = '';
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    const { data, error } = await supabaseClient.from('profiles').select('id, name, handle').neq('id', user.id).order('name').limit(30);
    if (error || !data?.length) { recipientSelect.innerHTML = '<option value="">Nenhuma outra pessoa cadastrada</option>'; activeRecipient = null; return; }
    data.forEach((profile) => addRecipientOption(profile));
  } else {
    [{ id: 'local-luiza', name: 'Luiza Prado', handle: 'luizaprado' }, { id: 'local-rafael', name: 'Rafael Moura', handle: 'rafaelmoura' }].forEach(addRecipientOption);
  }
  activeRecipient = [...recipientSelect.options].find((option) => option.value === activeRecipient?.id) ? activeRecipient : optionToRecipient(recipientSelect.options[0]);
  recipientSelect.value = activeRecipient?.id || '';
}

function addRecipientOption(profile) {
  const option = document.createElement('option');
  option.value = profile.id;
  option.textContent = `${profile.name}  @${profile.handle}`;
  option.dataset.name = profile.name;
  option.dataset.handle = profile.handle;
  recipientSelect.append(option);
}

function optionToRecipient(option) {
  return option ? { id: option.value, name: option.dataset.name, handle: option.dataset.handle } : null;
}

async function loadMessageThread() {
  if (!activeRecipient) { messageThread.innerHTML = '<p class="empty-comments">Escolha uma pessoa para começar.</p>'; return; }
  if (supabaseClient) {
    const user = await getSupabaseUser();
    const { data, error } = await supabaseClient.from('messages').select('sender_id, receiver_id, body, created_at').or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeRecipient.id}),and(sender_id.eq.${activeRecipient.id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
    if (error) { messageThread.innerHTML = '<p class="empty-comments">Não foi possível carregar a conversa.</p>'; return; }
    renderMessages(data, user.id);
  } else {
    const key = `possivel-messages-${activeRecipient.handle}`;
    renderMessages(JSON.parse(localStorage.getItem(key) || '[]'), 'me');
  }
}

function renderMessages(messages, currentUserId) {
  messageThread.innerHTML = messages.length ? messages.map((message) => `<div class="message-bubble ${message.sender_id === currentUserId || message.sender === 'me' ? 'outgoing' : 'incoming'}"><p>${message.body.replace(/[<>]/g, '')}</p><small>${new Date(message.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') : '<p class="empty-comments">Ainda não há mensagens. Diga oi.</p>';
  messageThread.scrollTop = messageThread.scrollHeight;
}

async function sendMessage(event) {
  event.preventDefault();
  const body = messageText.value.trim();
  if (!body || !activeRecipient || !requireLogin()) return;
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    const { error } = await supabaseClient.from('messages').insert({ sender_id: user.id, receiver_id: activeRecipient.id, body });
    if (error) { showToast('Não foi possível enviar a mensagem.'); return; }
  } else {
    const key = `possivel-messages-${activeRecipient.handle}`;
    const messages = JSON.parse(localStorage.getItem(key) || '[]');
    messages.push({ sender: 'me', body, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(messages));
  }
  messageText.value = '';
  await loadMessageThread();
}

function subscribeToMessages() {
  if (!supabaseClient || messageChannel) return;
  messageChannel = supabaseClient.channel('possivel-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { if (messagesDialog.open) loadMessageThread(); }).subscribe();
}

function openListing() {
  if (!requireLogin()) return;
  listingError.textContent = '';
  listingForm.reset();
  listingType = 'venda';
  document.querySelectorAll('[data-listing-type]').forEach((tab) => tab.classList.toggle('active', tab.dataset.listingType === listingType));
  tradeOnly.hidden = true;
  openDialog(listingDialog);
  listingTitle.focus();
}

function makeListingItem(listing) {
  const item = document.createElement('div');
  item.className = 'market-item listing-item';
  const price = listing.listing_type === 'troca' ? 'troca' : `R$ ${Number(listing.price || 0).toFixed(2).replace('.', ',')}`;
  const action = listing.listing_type === 'venda' ? '<button class="buy-button" type="button">Comprar</button>' : '<span class="trade-badge">troca</span>';
  item.innerHTML = `<div class="market-photo ${listing.listing_type === 'troca' ? 'red' : 'yellow'}"></div><div class="listing-copy"><strong>${listing.title.replace(/[<>]/g, '')}</strong><small>${price} · ${listing.location.replace(/[<>]/g, '')}</small></div>${action}`;
  item.querySelector('.buy-button')?.addEventListener('click', () => openPayment({ kind: 'purchase', listingId: listing.id, title: listing.title, amount: listing.price }));
  return item;
}

async function saveListing(event) {
  event.preventDefault();
  const title = listingTitle.value.trim();
  const description = listingDescription.value.trim();
  const location = listingLocation.value.trim();
  const price = listingType === 'troca' ? null : Number(listingPrice.value || 0);
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return; }
    const { data, error } = await supabaseClient.from('listings').insert({ seller_id: user.id, title, description, listing_type: listingType, price, location }).select('*').single();
    if (error) { listingError.textContent = error.message; return; }
    marketItems.prepend(makeListingItem(data));
  } else {
    const session = getSession();
    const listing = { id: `local-listing-${Date.now()}`, title, description, listing_type: listingType, price, location, seller_name: session.name };
    const listings = JSON.parse(localStorage.getItem('possivel-listings') || '[]');
    localStorage.setItem('possivel-listings', JSON.stringify([listing, ...listings]));
    marketItems.prepend(makeListingItem(listing));
  }
  closeDialog(listingDialog);
  showToast('Anúncio publicado no mercado.');
}

async function loadListings() {
  if (supabaseClient) {
    const { data } = await supabaseClient.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(8);
    data?.forEach((listing) => marketItems.prepend(makeListingItem(listing)));
    return;
  }
  JSON.parse(localStorage.getItem('possivel-listings') || '[]').forEach((listing) => marketItems.prepend(makeListingItem(listing)));
}

function openPayment(context = { kind: 'donation' }) {
  if (!requireLogin()) return;
  paymentContext = context;
  const purchase = context.kind === 'purchase';
  paymentKicker.textContent = purchase ? 'mercado seguro' : 'contribuir';
  paymentTitle.textContent = purchase ? `Comprar ${context.title}` : 'Apoiar uma causa';
  paymentAmount.value = context.amount || '';
  paymentAmount.readOnly = purchase;
  paymentPurpose.value = purchase ? context.title : '';
  paymentError.textContent = '';
  openDialog(paymentDialog);
  paymentPurpose.focus();
}

async function savePayment(amount, purpose, provider) {
  const session = getSession();
  if (supabaseClient) {
    const user = await getSupabaseUser();
    if (!user) { openAuth('login'); return null; }
    const { data, error } = await supabaseClient.from('payments').insert({ payer_id: user.id, listing_id: paymentContext.listingId, kind: paymentContext.kind, amount, provider, purpose, status: 'pending' }).select('id').single();
    if (error) throw error;
    return data.id;
  }
  const payment = { id: `local-payment-${Date.now()}`, kind: paymentContext.kind, listingId: paymentContext.listingId, amount, provider, purpose, status: 'pending', email: session?.email };
  const payments = JSON.parse(localStorage.getItem('possivel-payments') || '[]');
  localStorage.setItem('possivel-payments', JSON.stringify([payment, ...payments]));
  return payment.id;
}

async function startPayment(event) {
  event.preventDefault();
  const amount = Number(paymentAmount.value);
  const purpose = paymentPurpose.value.trim();
  const provider = paymentMethod.value;
  if (!amount || amount < 1 || !purpose) { paymentError.textContent = 'Informe um valor válido e a finalidade.'; return; }
  try {
    const paymentId = await savePayment(amount, purpose, provider);
    if (!paymentId) return;
    const checkoutUrl = window.POSSIVEL_SUPABASE?.checkoutFunctionUrl;
    if (checkoutUrl) {
      const response = await fetch(checkoutUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, provider, amount, purpose, kind: paymentContext.kind, listingId: paymentContext.listingId }) });
      const checkout = await response.json();
      if (!response.ok || !checkout.checkout_url) throw new Error(checkout.error || 'Não foi possível iniciar o checkout.');
      window.location.href = checkout.checkout_url;
      return;
    }
    closeDialog(paymentDialog);
    showToast('Pedido registrado. Configure o checkout para concluir o pagamento.');
  } catch (error) {
    paymentError.textContent = error.message || 'Não foi possível iniciar o pagamento.';
  }
}

async function openCall() {
  if (!requireLogin()) return;
  openDialog(callDialog);
  callNote.textContent = 'Solicitando acesso à câmera e ao microfone...';
  try {
    callStream = await navigator.mediaDevices.getUserMedia({ video: callMode === 'video', audio: true });
    localVideo.srcObject = callStream;
    localVideo.hidden = callMode !== 'video';
    callNote.textContent = 'Prévia pronta. Entre na sala para conversar com outras pessoas.';
  } catch (error) {
    callNote.textContent = 'Não foi possível acessar câmera/microfone. Confira as permissões do navegador.';
  }
}

function stopCall() {
  callStream?.getTracks().forEach((track) => track.stop());
  callStream = null;
  localVideo.srcObject = null;
  closeDialog(callDialog);
}

async function joinCallRoom() {
  const roomFunctionUrl = window.POSSIVEL_SUPABASE?.callFunctionUrl;
  if (!roomFunctionUrl) {
    callNote.textContent = 'Configure callFunctionUrl para conectar outras pessoas à sala.';
    return;
  }
  try {
    const response = await fetch(roomFunctionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: callMode }) });
    const room = await response.json();
    if (!response.ok || !room.room_url) throw new Error(room.error || 'Sala indisponível.');
    window.open(room.room_url, '_blank', 'noopener');
    callNote.textContent = 'Sala aberta em uma nova aba.';
  } catch (error) {
    callNote.textContent = error.message || 'Não foi possível abrir a sala.';
  }
}

function openReport(postId) {
  if (!requireLogin()) return;
  reportPostId = postId;
  reportReason.value = 'spam';
  reportDetails.value = '';
  reportError.textContent = '';
  openDialog(reportDialog);
}

async function submitReport(event) {
  event.preventDefault();
  if (!reportPostId || !requireLogin()) return;
  const reason = reportReason.value;
  const details = reportDetails.value.trim();
  try {
    if (supabaseClient) {
      const user = await getSupabaseUser();
      if (!user) { openAuth('login'); return; }
      const { error } = await supabaseClient.from('reports').insert({ reporter_id: user.id, post_id: Number.isFinite(Number(reportPostId)) ? Number(reportPostId) : null, reason, details });
      if (error) throw error;
    } else {
      const reports = JSON.parse(localStorage.getItem('possivel-reports') || '[]');
      reports.push({ postId: reportPostId, reason, details, reporter: getSession().email, createdAt: new Date().toISOString() });
      localStorage.setItem('possivel-reports', JSON.stringify(reports));
    }
    closeDialog(reportDialog);
    showToast('Denúncia recebida. Nossa equipe vai analisar.');
  } catch (error) {
    reportError.textContent = 'Não foi possível enviar a denúncia. Tente novamente.';
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function openComposer(type = 'Post') {
  const titles = { Mensagem: 'Comece uma conversa', Vídeo: 'Mostre o que tornou algo possível', Foto: 'Adicione uma imagem', Local: 'Compartilhe um lugar', Doação: 'Faça algo circular' };
  dialogTitle.textContent = titles[type] || 'Compartilhe uma possibilidade';
  composeText.placeholder = type === 'Mensagem' ? 'Para quem você quer mandar uma mensagem?' : 'Escreva o que está acontecendo...';
  if (type === 'Foto' || type === 'Vídeo') mediaInput.accept = type === 'Foto' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm';
  openDialog(dialog);
  composeText.focus();
  if (type === 'Foto' || type === 'Vídeo') mediaInput.click();
}

function clearSelectedMedia() {
  selectedMedia = null;
  mediaInput.value = '';
  mediaPreview.hidden = true;
  mediaPreviewContent.innerHTML = '';
}

function showSelectedMedia(file) {
  selectedMedia = file;
  const url = URL.createObjectURL(file);
  mediaPreviewContent.innerHTML = file.type.startsWith('video/') ? `<video src="${url}" controls></video>` : `<img src="${url}" alt="Pré-visualização da imagem" />`;
  mediaPreview.hidden = false;
}

mediaInput.addEventListener('change', () => {
  const file = mediaInput.files[0];
  if (!file) return;
  const validImage = file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024;
  const validVideo = file.type.startsWith('video/') && file.size <= 100 * 1024 * 1024;
  if (!validImage && !validVideo) { clearSelectedMedia(); showToast(file.type.startsWith('video/') ? 'O vídeo deve ter no máximo 100 MB.' : 'A imagem deve ter no máximo 10 MB.'); return; }
  showSelectedMedia(file);
});
removeMedia.addEventListener('click', clearSelectedMedia);

document.querySelectorAll('[data-compose]').forEach((button) => {
  button.addEventListener('click', () => button.dataset.compose === 'Doação' ? openPayment() : openComposer(button.dataset.compose));
});
document.querySelector('#composerButton').addEventListener('click', () => openComposer());
document.querySelector('#newButton').addEventListener('click', () => openComposer());
document.querySelector('#publishButton').addEventListener('click', async (event) => {
  const text = composeText.value.trim();
  if (!text || !requireLogin()) {
    event.preventDefault();
    if (!text) showToast('Escreva alguma coisa antes de publicar.');
    return;
  }
  event.preventDefault();
  try {
    const savedPost = await savePost(text, selectedMedia);
    const session = getSession();
    if (!savedPost || !session) { showToast('Entre para publicar.'); return; }
    const post = makePostElement({ id: savedPost.id, body: text, name: session.name, handle: session.handle, mediaUrl: savedPost.mediaUrl, mediaType: savedPost.mediaType });
    feedList.prepend(post);
  } catch (error) {
    showToast('Não foi possível salvar a publicação.');
    return;
  }
  composeText.value = '';
  clearSelectedMedia();
  closeDialog(dialog);
  showToast('Publicado na sua comunidade.');
});
document.querySelectorAll('[data-call]').forEach((button) => button.addEventListener('click', openCall));
document.querySelector('#notifyButton').addEventListener('click', () => showToast('Você tem 4 novidades na sua comunidade.'));
document.querySelector('#helpButton').addEventListener('click', () => showToast('Aqui, toda ação pode virar uma conexão.'));
document.querySelectorAll('.follow-button').forEach((button) => button.addEventListener('click', () => { button.textContent = '✓'; button.classList.add('following'); showToast('Conexão adicionada.'); }));

document.querySelectorAll('.text-button:not(#marketButton)').forEach((button) => button.addEventListener('click', () => showToast('Mais possibilidades chegando em breve.')));
function attachLike(button) { button.addEventListener('click', () => toggleLike(button.closest('.post').dataset.postId, button)); }
document.querySelectorAll('.like-button').forEach(attachLike);
document.querySelectorAll('.like-button').forEach((button) => applyLocalLikeState(button, button.closest('.post').dataset.postId));
document.querySelectorAll('.comment-button').forEach((button) => button.addEventListener('click', () => openComments(button.closest('.post').dataset.postId)));
document.querySelectorAll('.post .more-button').forEach((button) => button.addEventListener('click', () => openReport(button.closest('.post').dataset.postId)));
document.querySelector('#searchInput').addEventListener('input', (event) => { const query = event.target.value.toLowerCase().trim(); document.querySelectorAll('.post').forEach((post) => { post.hidden = query && !post.dataset.search.includes(query); }); });
document.querySelector('#filterButton').addEventListener('click', () => { const newest = document.querySelector('#filterButton'); newest.innerHTML = newest.textContent.includes('recentes') ? 'Mais comentados <span>⌄</span>' : 'Mais recentes <span>⌄</span>'; showToast('Filtro atualizado.'); });
marketButton.addEventListener('click', openListing);
document.querySelectorAll('[data-listing-type]').forEach((tab) => tab.addEventListener('click', () => { listingType = tab.dataset.listingType; document.querySelectorAll('[data-listing-type]').forEach((item) => item.classList.toggle('active', item === tab)); tradeOnly.hidden = listingType !== 'troca'; listingPrice.required = listingType !== 'troca'; }));
listingForm.addEventListener('submit', saveListing);
paymentForm.addEventListener('submit', startPayment);
document.querySelectorAll('[data-call-mode]').forEach((tab) => tab.addEventListener('click', () => { callMode = tab.dataset.callMode; document.querySelectorAll('[data-call-mode]').forEach((item) => item.classList.toggle('active', item === tab)); if (callStream) { stopCall(); openCall(); } }));
closeCall.addEventListener('click', stopCall);
endCall.addEventListener('click', stopCall);
joinCall.addEventListener('click', joinCallRoom);
muteCall.addEventListener('click', () => { const track = callStream?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; muteCall.textContent = track.enabled ? 'Microfone' : 'Microfone desligado'; } });
toggleCamera.addEventListener('click', () => { const track = callStream?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; toggleCamera.textContent = track.enabled ? 'Câmera' : 'Câmera desligada'; } });
reportForm.addEventListener('submit', submitReport);
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach((link) => link.classList.remove('active')); item.classList.add('active'); }));
document.querySelector('.nav-item[href="#mensagens"]').addEventListener('click', (event) => { event.preventDefault(); openMessages(); });
recipientSelect.addEventListener('change', async () => { activeRecipient = optionToRecipient(recipientSelect.selectedOptions[0]); await loadMessageThread(); });
messageForm.addEventListener('submit', sendMessage);
closeMessages.addEventListener('click', () => closeDialog(messagesDialog));
document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.addEventListener('click', () => openAuth(tab.dataset.authMode)));
authForm.addEventListener('submit', handleAuthSubmit);
accountButton.addEventListener('click', () => {
  if (supabaseClient) {
    supabaseClient.auth.signOut().then(() => { updateSupabaseAuthUI(); showToast('Você saiu da sua conta.'); });
    return;
  }
  if (localStorage.getItem('possivel-session')) {
    localStorage.removeItem('possivel-session');
    updateAuthUI();
    showToast('Você saiu da sua conta.');
  } else {
    openAuth();
  }
});
profileButton.addEventListener('click', () => {
  openProfileEditor();
});
profileForm.addEventListener('submit', saveProfile);
commentsForm.addEventListener('submit', submitComment);
document.querySelector('#forgotPasswordButton').addEventListener('click', recoverPassword);
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(() => updateSupabaseAuthUI());
  updateSupabaseAuthUI();
  subscribeToMessages();
} else {
  document.querySelector('#authNote').textContent = 'Modo local até configurar o Supabase. Depois, sua conta funcionará em qualquer dispositivo.';
  messageNote.textContent = 'Modo local: suas conversas ficam salvas neste navegador.';
}
updateAuthUI();
loadPersistedPosts();
loadListings();