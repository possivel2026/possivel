# Supabase Setup

1. Execute `supabase-schema.sql` para manter o site atual.
2. Execute `supabase/migrations/202608040001_mobile_subscriptions.sql`.
3. Faça deploy das functions em `supabase/functions`.
4. Configure Storage `posts-media` conforme schema existente.
5. Habilite Realtime para `messages`.

RLS: usuários leem apenas dados próprios de assinatura e uso. Alterações de assinatura dependem de service role nas Edge Functions.
