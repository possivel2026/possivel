# Possível

Plataforma social para publicar, conversar, seguir pessoas, vender ou trocar itens, criar causas e receber apoio.

## O que esta versão entrega

### Web
- cadastro, login, logout, recuperação e redefinição de senha com Supabase Auth;
- perfil editável com nome, @usuário, bio e avatar;
- feed real com texto, foto e vídeo;
- curtidas persistentes, sem contador negativo e com estado restaurado após recarregar;
- comentários persistentes e exclusão pelo próprio autor;
- conexões/seguir pessoas;
- notificações automáticas de follow, curtida, comentário e mensagem;
- mensagens privadas com Supabase Realtime;
- marketplace com venda, troca, imagem, limite por plano e marcação de vendido;
- causas/projetos com meta, valor arrecadado e apoios reais;
- pagamentos avulsos e assinatura Possível Pro preparados para Mercado Pago;
- chamadas privadas de áudio/vídeo preparadas para Daily;
- denúncias, bloqueios no banco, RLS e Storage;
- painel de impacto com números reais;
- planos Free e Possível Pro.

### Mobile
A pasta `mobile/` contém o app Expo/React Native em TypeScript, integrado ao mesmo Supabase e ao backend de assinaturas.

## Configuração obrigatória

1. Execute todo o arquivo `supabase-schema.sql` no SQL Editor do Supabase.
2. Confirme que `supabase-config.js` possui somente a Project URL e a chave pública/anon.
3. Em Authentication > URL Configuration, adicione:
   - `https://marcelinfreefire153-arch.github.io/possivel/`
4. Implante as Edge Functions de `supabase/functions/`.
5. Configure os secrets externos no Supabase.

## Variáveis externas ainda necessárias

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `APP_URL`
- `PAYMENT_WEBHOOK_URL`
- `DAILY_API_KEY`

A chave `service_role`, senha do banco e tokens privados nunca devem ser colocados no frontend.

## Edge Functions principais

- `create-subscription-checkout`: inicia assinatura Pro;
- `payment-webhook`: atualiza assinatura;
- `create-payment-checkout`: inicia compra ou doação;
- `payment-events-webhook`: confirma compra ou doação;
- `create-call-room`: cria sala privada Daily.

## Testes locais

```bash
node --check script.js
node tests/static-check.mjs
```

## GitHub Pages

A publicação usa `.github/workflows/deploy-pages.yml`. O workflow valida o JavaScript e os arquivos obrigatórios antes do deploy.
