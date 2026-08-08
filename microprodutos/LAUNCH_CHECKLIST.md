# Possível Labs — checklist de lançamento

Alvo: 8 de agosto de 2026.

## 1. Vercel

Crie/importa o projeto usando este repositório e defina `microprodutos` como **Root Directory**.

Adicione estas variáveis apenas na Vercel (Production/Preview conforme necessário):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — privada, nunca colocar no navegador/GitHub
- `CREATOR_USER_ID=6ae17221-3858-4d8c-8c42-5bbc4d0753ec`
- `MERCADOPAGO_ACCESS_TOKEN` — privada
- `MERCADOPAGO_WEBHOOK_SECRET` — privada

## 2. Supabase

1. Execute `supabase-admin-schema.sql` no SQL Editor.
2. Confirme que a conta de criador no Supabase Auth possui exatamente o UUID definido em `CREATOR_USER_ID`.
3. Confirme que `revenue_events` e `withdrawal_requests` estão com RLS habilitado e sem policies públicas.

## 3. Mercado Pago

1. Use credenciais de produção somente no ambiente Production da Vercel.
2. Configure o webhook de pagamentos para `https://SEU-DOMINIO/api/mercadopago-webhook`.
3. Copie a assinatura secreta de Webhooks para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Faça uma compra real de valor mínimo aceitável e confirme que o pagamento aprovado aparece em `revenue_events` e no painel.

O endpoint valida a origem do Webhook com o SDK oficial e depois consulta o pagamento diretamente na API do Mercado Pago antes de registrar receita.

## 4. Painel do criador

- Abra **Criador** no topo.
- Entre com a conta Supabase que possui o UUID autorizado.
- Verifique que outra conta recebe `creator_only`/acesso recusado.
- Confira faturamento, saldo disponível e histórico.
- Faça uma solicitação de saque pequena de teste.

Importante: o botão de saque registra e reserva o valor no ledger. Ele não inventa uma transferência bancária automática. A liquidação real precisa ser realizada/confirmada na conta financeira configurada no provedor.

## 5. Teste público obrigatório

Testar em pelo menos:

- Chrome/Edge desktop
- Firefox desktop
- Chrome Android
- Safari iPhone, se disponível

Validar as 10 ferramentas, tema claro/escuro, busca, retorno da ferramenta, armazenamento local, impressão do currículo, download de QR/imagem, viewport mobile e painel do criador.

## 6. SEO e domínio

- Trocar a URL placeholder de `sitemap.xml` pelo domínio final.
- Adicionar o domínio no Google Search Console.
- Configurar favicon/OG image antes de campanhas pagas.

## Critério de go-live

Só marcar o PR como pronto/mergear após: deploy Preview abrir sem erro, APIs responderem, login de criador funcionar, teste de pagamento chegar via webhook e teste mobile concluir sem bloqueador.
