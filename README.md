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
- registro de pagamentos e integração preparada para Mercado Pago;
- chamadas preparadas para LiveKit ou Daily;
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
4. Para pagamentos/assinatura, implante as Edge Functions em `supabase/functions/` e configure os secrets descritos em `mobile/PAYMENTS_SETUP.md`.
5. Para chamadas reais, configure LiveKit ou Daily e preencha `callFunctionUrl`.

## Variáveis externas ainda necessárias

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `APP_URL`
- `PAYMENT_WEBHOOK_URL`
- credenciais do provedor de chamadas

A chave `service_role`, senha do banco e tokens privados nunca devem ser colocados no frontend.

## Testes locais

```bash
node --check script.js
node tests/static-check.mjs
```

## GitHub Pages

A publicação usa `.github/workflows/deploy-pages.yml`. O workflow valida o JavaScript e os arquivos obrigatórios antes do deploy.
