# Setup Mobile

1. Copie `.env.example` para `.env`.
2. Preencha `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_APP_URL` e `EXPO_PUBLIC_LIVEKIT_URL`.
3. Execute `npm install` dentro de `mobile`.
4. Rode `npm run start` e abra no Android/Expo Go ou em emulador.

Nenhum segredo administrativo deve ser colocado no app. Tokens Mercado Pago, LiveKit secret e service role ficam no Supabase Functions.
