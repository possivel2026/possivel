window.POSSIVEL_SUPABASE = {
  url: 'https://nwymsiuwiqyvvmdagzeg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im53eW1zaXV3aXF5dnZtZGFnemVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NDk1MTEsImV4cCI6MjEwMTEyNTUxMX0.PRlMlBncRxJDcbYtteGkQM86vcDlTSyPexsQB402I6Y',
  checkoutFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-subscription-checkout',
  paymentFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-payment-checkout',
  callFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-call-room',
  aiFunctionName: 'possivel-ai',
  proPriceLabel: 'R$ 15,99/mês'
};

// Compatibilidade e estabilidade do cliente Supabase.
// - resolve explicitamente o autor do post no PostgREST;
// - reutiliza o primeiro cliente para os módulos extras;
// - repete uma leitura de perfil quando houver falha transitória de rede/JWT.
(() => {
  const sdk = window.supabase;
  if (!sdk?.createClient || sdk.__possivelClientFixes) return;

  const originalCreateClient = sdk.createClient.bind(sdk);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function isRetryable(result) {
    if (!result?.error) return false;
    const code = String(result.error.code || '').toLowerCase();
    const message = String(result.error.message || '').toLowerCase();
    const status = Number(result.status || 0);
    return status === 0 || status === 401 || status === 408 || status === 429 || status >= 500 ||
      code.includes('fetch') || message.includes('fetch') || message.includes('network') ||
      message.includes('jwt') || message.includes('timeout') || message.includes('temporar');
  }

  function addRetry(query, client) {
    if (!query || typeof query.then !== 'function' || query.__possivelRetry) return query;
    const originalThen = query.then.bind(query);
    query.__possivelRetry = true;
    query.then = (onFulfilled, onRejected) => {
      const execute = async () => {
        let result = await originalThen((value) => value);
        if (!isRetryable(result)) return result;

        const status = Number(result?.status || 0);
        const message = String(result?.error?.message || '').toLowerCase();
        if (status === 401 || message.includes('jwt')) {
          try { await client.auth.refreshSession(); } catch (_) { /* tenta novamente abaixo */ }
        }
        await wait(300);
        result = await originalThen((value) => value);
        return result;
      };
      return execute().then(onFulfilled, onRejected);
    };
    return query;
  }

  sdk.createClient = (...args) => {
    const client = originalCreateClient(...args);
    if (!window.POSSIVEL_DB) window.POSSIVEL_DB = client;
    const originalFrom = client.from.bind(client);

    client.from = (relation) => {
      const builder = originalFrom(relation);
      if (typeof builder?.select !== 'function') return builder;

      const originalSelect = builder.select.bind(builder);
      builder.select = (columns = '*', options) => {
        const resolvedColumns = relation === 'posts' && typeof columns === 'string'
          ? columns.replace(/\bprofiles\(/g, 'profiles!posts_author_id_fkey(')
          : columns;
        const query = originalSelect(resolvedColumns, options);
        return relation === 'profiles' ? addRetry(query, client) : query;
      };
      return builder;
    };

    return client;
  };

  sdk.__possivelClientFixes = true;
})();

(() => {
  const loadExperience = () => {
    if (!document.querySelector('script[data-possivel-experience]')) {
      const script = document.createElement('script');
      script.src = 'site-experience.js?v=20260809-3';
      script.dataset.possivelExperience = 'true';
      script.defer = true;
      document.head.append(script);
    }

    if (!document.querySelector('script[data-possivel-messages-filter]')) {
      const script = document.createElement('script');
      script.src = 'messages-filter.js?v=20260809-3';
      script.dataset.possivelMessagesFilter = 'true';
      script.defer = true;
      document.head.append(script);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadExperience, { once: true });
  else loadExperience();
})();
