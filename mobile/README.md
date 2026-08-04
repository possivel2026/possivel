# Possível Mobile

Aplicativo Expo/React Native/TypeScript para Android usando a mesma autenticação, banco, storage e RLS do site Possível.

## Comandos

```bash
cd mobile
npm install
npm run start
npm run android
npm run typecheck
npm run lint
npm run test
```

## APK/AAB

Use EAS Build após configurar credenciais do projeto Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p android --profile production
```
