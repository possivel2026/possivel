# Pagamentos Mercado Pago

Edge Functions incluídas:

- `create-subscription-checkout`
- `payment-webhook`
- `get-subscription`
- `cancel-subscription`
- `restore-subscription`
- `get-entitlements`

Variáveis nas Supabase Edge Functions:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
POSSIVEL_PRO_PRICE=19.90
APP_URL=possivel://subscription/manage
```

Use token sandbox durante desenvolvimento e troque `MERCADO_PAGO_ACCESS_TOKEN` para produção somente no ambiente seguro das Edge Functions. Configure o webhook público para `/functions/v1/payment-webhook`.
