# Plano de implementação do aplicativo Possível

## Arquitetura atual

- O repositório contém um site estático sem etapa de build, publicado por Vercel/Netlify/GitHub Pages.
- A interface web principal está em `index.html`, com estilos em `styles.css` e lógica browser em `script.js`.
- A configuração pública do Supabase fica em `supabase-config.js` e aceita somente Project URL, anon key e URLs públicas de Edge Functions.
- O banco atual é descrito em `supabase-schema.sql` e inclui `profiles`, `posts`, `post_likes`, `comments`, `messages`, `listings`, `payments`, `call_sessions` e `reports`, com RLS básica.
- O site já usa Supabase Auth, PostgreSQL, Storage (`posts-media`) e Realtime para mensagens quando configurado; quando não configurado, usa fallback localStorage para demonstração web.

## APIs, rotas e integrações existentes

- Não há rotas server-side no repositório; o site consome Supabase diretamente do navegador.
- Integrações existentes documentadas: Supabase Auth/DB/Storage/Realtime, Edge Function de checkout genérica e Edge Function de chamada genérica.
- O schema já possui estruturas para posts, curtidas, comentários, mensagens, marketplace simples, pagamentos, chamadas e denúncias.
- Não existe implementação versionada de Supabase Edge Functions no repositório antes desta etapa.

## Recursos existentes

- Cadastro, login e recuperação de senha via Supabase Auth quando `supabase-config.js` está preenchido.
- Perfil básico e edição de nome, handle e bio.
- Feed com posts reais do Supabase, publicação de texto, imagem e vídeo no bucket `posts-media`.
- Curtidas, comentários e denúncias de posts.
- Mensagens diretas com Supabase Realtime.
- Marketplace simples para venda/troca.
- Pagamentos registrados na tabela `payments`, mas checkout real depende de Edge Function externa.
- Chamada com captura local de câmera/microfone e criação remota dependente de Edge Function externa.

## Recursos faltantes

- Aplicativo mobile Expo/React Native.
- Navegação mobile com rotas protegidas, deep links e telas completas.
- Camada backend de planos, assinatura, entitlements e limites.
- Integração Mercado Pago versionada como Supabase Edge Functions.
- Limites Free/Pro aplicados no backend.
- Tabelas de assinatura, eventos de webhook, idempotência e contadores de uso.
- Documentação mobile, pagamentos e Supabase atualizada.
- Testes automatizados para planos, pagamentos, posts, marketplace e mensagens.

## Arquitetura proposta

- Criar `/mobile` como app Expo com TypeScript, Expo Router, Supabase JS, TanStack Query, React Hook Form, Zod e SecureStore.
- Centralizar limites e benefícios em `mobile/constants/plans.ts`, espelhados em `supabase/functions/_shared/plans.ts` e sem espalhar números no app.
- Usar Supabase Auth e as mesmas tabelas do site para dados reais.
- Manter tokens secretos exclusivamente nas Supabase Edge Functions.
- Criar Edge Functions desacopladas por provider com interface `PaymentProvider`, iniciando por Mercado Pago sandbox/produção via variáveis de ambiente.
- Aplicar autorização no servidor por RPC SQL e Edge Functions: `get_user_entitlements`, `can_use_feature`, `check_plan_limit`.
- Preservar o site estático intacto e adicionar apenas novos artefatos.

## Alterações no banco

- Adicionar `subscriptions`, `plan_entitlements`, `usage_counters`, `payment_webhook_events`, `feature_audit_logs`, `listing_favorites`, `projects`, `project_participants`, `donations`, `blocks`, `notifications`, `post_views` e colunas auxiliares em `listings`.
- Ativar RLS em todas as tabelas sensíveis.
- Permitir ao usuário ler apenas suas assinaturas, uso, notificações e eventos próprios.
- Bloquear alteração direta de assinaturas pelo cliente; updates ocorrem via service role nas Edge Functions.
- Criar índices, constraints e funções RPC para entitlements e limites.

## Riscos técnicos

- Sem credenciais reais de Supabase, Mercado Pago e LiveKit, fluxos externos só podem ser validados em sandbox/configuração local.
- Mercado Pago pode exigir URLs públicas HTTPS para webhooks.
- Publicação oficial Android/iOS pode exigir faturamento in-app em vez de checkout web, dependendo da regra da loja e do tipo de benefício vendido.
- O schema web atual é simples; recursos avançados como chamadas multiusuário e estatísticas profundas dependem de evolução incremental.

## Ordem de implementação

1. Documentar arquitetura e inventário atual neste arquivo.
2. Criar scaffold Expo em `/mobile` com rotas, tema, componentes e serviços compartilhados.
3. Implementar autenticação, rotas protegidas e cliente Supabase com SecureStore.
4. Implementar feed, posts, comentários, marketplace, projetos, doações, mensagens realtime, chamadas e denúncias conectados ao Supabase.
5. Implementar telas de planos, assinatura, gerenciamento e estatísticas Pro com bloqueios amigáveis.
6. Criar migrations de assinatura, entitlements, limites, auditoria e RLS.
7. Criar Supabase Edge Functions de checkout, webhook, assinatura, cancelamento, restauração e entitlements.
8. Adicionar testes unitários e de integração para regras críticas.
9. Documentar instalação, ambiente, pagamentos, Supabase e geração Android APK/AAB.
10. Rodar lint, typecheck e testes sem alterar o site existente.
