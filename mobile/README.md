# Possível Mobile

Aplicativo Expo/React Native que usa o mesmo projeto Supabase do site Possível.

## Recursos implementados

- cadastro, login, sessão persistente e recuperação de senha;
- perfil e avatar;
- feed real com texto, foto, vídeo, curtidas e comentários;
- conexões, seguir/deixar de seguir e bloqueio;
- mensagens privadas em tempo real;
- marketplace com venda, troca, doação e limite Free/Pro;
- causas, metas, apoios e checkout de doação;
- notificações em tempo real;
- planos Free/Pro, checkout e cancelamento;
- denúncias e chamadas de áudio/vídeo preparadas com Daily.

Não há dados de demonstração: estados vazios são exibidos quando o banco não possui conteúdo.

## Executar

```bash
cd mobile
npm install
npx expo start
```

A URL e a chave `anon` pública do Supabase possuem fallback no app. Para usar outro projeto, copie `.env.example` para `.env` e altere os valores.

## Configurações externas ainda necessárias

No Supabase Auth, adicione `possivel://login` e `possivel://reset-password` às URLs de redirecionamento. Para pagamentos e chamadas, implante as Edge Functions e configure os segredos descritos no README principal.
