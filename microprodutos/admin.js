(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  let client=null;
  let token='';

  async function init(){
    const button=$('#creatorButton');
    const panel=$('#creatorPanel');
    if(!button||!panel)return;
    button.addEventListener('click',()=>{panel.classList.remove('hidden');panel.scrollIntoView({behavior:'smooth'});refreshSession();});
    $('#creatorClose')?.addEventListener('click',()=>panel.classList.add('hidden'));
    $('#creatorLogin')?.addEventListener('submit',login);
    $('#creatorLogout')?.addEventListener('click',logout);
    $('#withdrawForm')?.addEventListener('submit',withdraw);
    try{
      const cfg=await fetch('/api/public-config',{cache:'no-store'}).then(r=>r.json());
      if(!cfg.configured||!window.supabase){setStatus('Painel aguardando configuração do Supabase na Vercel.','warn');return;}
      client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
      await refreshSession();
      client.auth.onAuthStateChange(()=>refreshSession());
    }catch(e){console.error(e);setStatus('Não foi possível iniciar o painel administrativo.','warn');}
  }

  function setStatus(text,kind=''){
    const el=$('#creatorStatus');if(!el)return;el.textContent=text;el.dataset.kind=kind;
  }

  async function refreshSession(){
    if(!client)return;
    const {data}=await client.auth.getSession();
    token=data.session?.access_token||'';
    $('#creatorAuth').classList.toggle('hidden',Boolean(token));
    $('#creatorDashboard').classList.toggle('hidden',!token);
    if(token) await loadDashboard();
  }

  async function login(e){
    e.preventDefault();if(!client)return setStatus('Configure o Supabase primeiro.','warn');
    const email=$('#creatorEmail').value.trim(),password=$('#creatorPassword').value;
    setStatus('Autenticando...');
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)return setStatus('Login recusado. Use a conta de criador autorizada.','warn');
    setStatus('Conta autenticada.');
  }

  async function logout(){if(client)await client.auth.signOut();token='';setStatus('Sessão encerrada.');}

  async function api(path,options={}){
    const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(options.headers||{})}});
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(body.error||`http_${r.status}`),{body,status:r.status});
    return body;
  }

  async function loadDashboard(){
    try{
      setStatus('Carregando dados da Wayne Corporation...');
      const d=await api('/api/admin-summary');
      $('#creatorIdentity').textContent=`Criador verificado • ${d.creator.label}`;
      $('#metricGross').textContent=money(d.metrics.gross);
      $('#metricAvailable').textContent=money(d.metrics.available);
      $('#metricRequested').textContent=money(d.metrics.requested);
      $('#metricPaid').textContent=money(d.metrics.paid);
      $('#revenueRows').innerHTML=(d.revenue||[]).slice(0,12).map(x=>`<tr><td>${new Date(x.created_at).toLocaleDateString('pt-BR')}</td><td>${x.source||'—'}</td><td>${x.status}</td><td>${money(x.amount)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhuma receita registrada ainda.</td></tr>';
      $('#withdrawRows').innerHTML=(d.withdrawals||[]).slice(0,12).map(x=>`<tr><td>${new Date(x.created_at).toLocaleDateString('pt-BR')}</td><td>${x.status}</td><td>${x.destination_label||'Wayne Corporation'}</td><td>${money(x.amount)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhuma solicitação de saque.</td></tr>';
      setStatus('Painel atualizado.','ok');
    }catch(e){
      console.error(e);
      if(e.status===403){setStatus('Esta conta não possui permissão de criador.','warn');await logout();}
      else setStatus('Backend financeiro indisponível. Verifique as variáveis e o schema.','warn');
    }
  }

  async function withdraw(e){
    e.preventDefault();
    const amount=Number($('#withdrawAmount').value);
    if(!Number.isFinite(amount)||amount<1)return setStatus('Informe um valor de saque válido.','warn');
    if(!confirm(`Registrar solicitação de saque de ${money(amount)} para Wayne Corporation?`))return;
    try{
      setStatus('Registrando solicitação...');
      const d=await api('/api/withdrawals',{method:'POST',body:JSON.stringify({amount})});
      setStatus(d.note||'Solicitação registrada.','ok');
      $('#withdrawAmount').value='';
      await loadDashboard();
    }catch(e){
      if(e.body?.available!=null)setStatus(`Saldo disponível: ${money(e.body.available)}.`,'warn');
      else setStatus('Não foi possível registrar o saque.','warn');
    }
  }

  window.addEventListener('DOMContentLoaded',init);
})();
