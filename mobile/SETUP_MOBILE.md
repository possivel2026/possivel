# Preparar e testar o aplicativo

1. Instale Node.js LTS e Android Studio ou o aplicativo Expo Go.
2. No terminal, entre na pasta `mobile`.
3. Execute `npm install`.
4. Execute `npx expo start`.
5. Leia o QR Code com o Expo Go ou pressione `a` para abrir o emulador Android.
6. Entre com a mesma conta usada no site.

Para gerar APK de teste com EAS:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
