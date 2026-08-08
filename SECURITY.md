# Segurança do Possível

## Princípio

O Possível usa defesa em profundidade. “Anti-hack” aqui significa reduzir superfícies de ataque, limitar abuso, proteger segredos e falhar de forma segura; não significa prometer invulnerabilidade.

## Camadas implementadas

- **Autenticação:** Supabase Auth e sessão persistente.
- **Autorização:** Row Level Security (RLS) em dados de usuário.
- **Bloqueios:** contas bloqueadas não podem seguir, enviar mensagens, curtir/comentar conteúdo entre si ou iniciar chamadas.
- **Anti-spam/bot:** triggers de rate limiting no PostgreSQL para posts, comentários, mensagens, anúncios, causas, follows, likes, denúncias, pagamentos e chamadas.
- **Pagamentos:** o servidor reconsulta anúncio/causa e determina o valor autorizado antes de criar checkout; o cliente não é fonte de verdade para preço.
- **Webhooks:** eventos de pagamento passam por verificação de assinatura.
- **Segredos:** service role, tokens de Mercado Pago, Daily e IA ficam apenas nas Edge Functions.
- **Frontend web:** Content Security Policy, limites de entrada e renderização de conteúdo de usuário sem HTML arbitrário.
- **IA:** limite diário por plano; entradas limitadas; nenhum segredo precisa ser enviado ao modelo; logs de auditoria não armazenam o texto completo do prompt.
- **Mídia:** bucket limita MIME types e tamanho; escrita fica restrita à pasta do próprio usuário.

## Operação segura

1. Execute `supabase/migrations/202608080001_ai_security_hardening.sql`.
2. Configure senhas fortes e MFA na conta que administra GitHub, Supabase, Mercado Pago e provedor de IA.
3. Nunca faça commit de `service_role`, chaves privadas, senhas, access tokens ou secrets de webhook.
4. Use credenciais sandbox durante desenvolvimento.
5. Revogue imediatamente qualquer secret que tenha sido exposto.
6. Revise logs do Supabase e do provedor de pagamento após comportamento suspeito.
7. Mantenha dependências e SDKs atualizados com testes antes de publicar.

## Limitações

GitHub Pages é hospedagem estática e não permite controlar todos os headers HTTP como um servidor próprio. Por isso o site usa CSP em `<meta>` e toda operação sensível permanece no Supabase/Edge Functions.

A Possível IA não deve receber senhas, tokens, códigos de recuperação, chaves privadas ou documentos sensíveis.
