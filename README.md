# possível

Site estático para comunidade, mensagens, mídia, mercado, doações e chamadas.

## Publicar no GitHub Pages

1. Crie um repositório público no GitHub, por exemplo `possivel`.
2. Envie todo o conteúdo desta pasta para a branch `main`.
3. Abra **Settings > Pages** no repositório.
4. Em **Build and deployment**, escolha **GitHub Actions**.
5. Aguarde o workflow `Publicar no GitHub Pages` terminar na aba **Actions**.

O endereço será parecido com:

```text
https://SEU-USUARIO.github.io/possivel/
```

O workflow já está em `.github/workflows/deploy-pages.yml` e publica automaticamente a cada push em `main` ou `master`.

Depois do primeiro deploy, adicione esse endereço no Supabase em **Authentication > URL Configuration**. Para recuperação de senha, use o endereço completo como URL permitida e como redirect.

## Publicar na Vercel

1. Crie um repositório no GitHub e envie o conteúdo desta pasta.
2. Entre em [vercel.com](https://vercel.com/) e escolha **Add New Project**.
3. Importe o repositório.
4. Use estas configurações:
   - Framework Preset: `Other`
   - Build Command: vazio
   - Output Directory: `.`
5. Clique em **Deploy**.

A configuração já está em `vercel.json`.

## Publicar na Netlify

1. Entre em [netlify.com](https://www.netlify.com/).
2. Escolha **Add new site > Import an existing project**.
3. Conecte o repositório GitHub.
4. Use:
   - Build command: vazio
   - Publish directory: `.`
5. Clique em **Deploy site**.

A configuração já está em `netlify.toml`.

Também é possível usar **Deploy manually** arrastando esta pasta para o Netlify Drop.

## Ativar o Supabase no domínio publicado

Depois de criar o endereço público, abra [supabase-config.js](supabase-config.js) e preencha a URL e a chave `anon` pública. Nunca coloque a `service_role key` no navegador.

No Supabase, em **Authentication > URL Configuration**, adicione:

```text
https://SEU-DOMINIO/
```

Também adicione a mesma origem para os redirects de recuperação de senha.

Execute [supabase-schema.sql](supabase-schema.sql) no SQL Editor antes de usar contas, posts, mídia, mensagens, mercado, pagamentos e denúncias reais.

## Checkout e chamadas

Preencha no `supabase-config.js` as URLs públicas das Edge Functions:

```javascript
checkoutFunctionUrl: 'https://SEU-PROJETO.supabase.co/functions/v1/create-checkout',
callFunctionUrl: 'https://SEU-PROJETO.supabase.co/functions/v1/create-call-room'
```

As chaves secretas do Stripe, Mercado Pago, LiveKit ou Daily devem ficar somente nas Edge Functions.

## Verificação local

O projeto não precisa de build. Para testar os arquivos por HTTP, sirva a pasta em `http://localhost:4174/` ou use qualquer servidor estático.

Antes de publicar, confira:

- Login e recuperação de senha no domínio final
- Upload de imagem e vídeo
- Regras RLS do Supabase
- URLs de checkout e chamadas
- Termos de uso e política de privacidade
- Domínio e HTTPS
