# Possível Labs

Hub com dez microprodutos úteis e independentes, construído em HTML, CSS e JavaScript puro para reduzir custo, dependências e tempo de publicação.

## Ferramentas incluídas

1. Calculadora de juros compostos
2. Orçamento pessoal com armazenamento local
3. Criador de currículo com impressão em PDF
4. Gerador e download de QR Code
5. Criador de links para WhatsApp
6. Construtor de URLs com parâmetros UTM
7. Gerador criptograficamente seguro de senhas
8. Cronômetro Pomodoro com contagem de sessões
9. Planejador de tarefas com armazenamento local
10. Conversor de imagens para PNG, JPEG e WebP

## Executar localmente

Abra `index.html` diretamente no navegador ou use um servidor estático:

```bash
python -m http.server 8080 --directory microprodutos
```

Depois acesse `http://localhost:8080`.

## Publicar na Vercel

Crie um novo projeto apontando para este repositório e defina **Root Directory** como `microprodutos`. Não há comando de build; o diretório de saída é o próprio diretório raiz.

## Arquitetura de evolução

- Fase 1: validar tráfego e uso das ferramentas gratuitas.
- Fase 2: adicionar analytics, páginas individuais e conteúdo SEO.
- Fase 3: integrar autenticação e sincronização via Supabase.
- Fase 4: liberar plano Pro com Mercado Pago.
- Fase 5: extrair as ferramentas com maior demanda para produtos independentes e APIs.

## Privacidade

As ferramentas processam os dados no navegador. Orçamento, tarefas, preferência de tema e contagem Pomodoro usam `localStorage`. Imagens e senhas não são enviadas para servidores por este código.
