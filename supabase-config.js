window.POSSIVEL_SUPABASE = {
  url: 'https://nwymsiuwiqyvvmdagzeg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eW1zaXV3aXF5dnZtZGFnemVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NDk1MTEsImV4cCI6MjEwMTEyNTUxMX0.PRlMlBncRxJDcbYtteGkQM86vcDlTSyPexsQB402I6Y',
  checkoutFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-subscription-checkout',
  paymentFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-payment-checkout',
  callFunctionUrl: 'https://nwymsiuwiqyvvmdagzeg.supabase.co/functions/v1/create-call-room',
  aiFunctionName: 'possivel-ai',
  proPriceLabel: 'R$ 29,99/mês'
};

// Compatibilidade para bancos onde o PostgREST detecta dois caminhos entre
// posts e profiles: o autor direto e o relacionamento many-to-many via likes.
// O feed precisa explicitamente do autor do post.
(() => {
  const sdk = window.supabase;
  if (!sdk?.createClient || sdk.__possivelFeedRelationshipFix) return;

  const originalCreateClient = sdk.createClient.bind(sdk);
  sdk.createClient = (...args) => {
    const client = originalCreateClient(...args);
    const originalFrom = client.from.bind(client);

    client.from = (relation) => {
      const builder = originalFrom(relation);
      if (relation !== 'posts' || typeof builder?.select !== 'function') return builder;

      const originalSelect = builder.select.bind(builder);
      builder.select = (columns = '*', options) => {
        const resolvedColumns = typeof columns === 'string'
          ? columns.replace(/\bprofiles\(/g, 'profiles!posts_author_id_fkey(')
          : columns;
        return originalSelect(resolvedColumns, options);
      };
      return builder;
    };

    return client;
  };

  sdk.__possivelFeedRelationshipFix = true;
})();
