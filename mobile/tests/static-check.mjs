import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const required = [
  'app/(auth)/login.tsx',
  'app/(auth)/signup.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/connections.tsx',
  'app/(tabs)/messages.tsx',
  'app/(tabs)/marketplace.tsx',
  'app/(tabs)/projects.tsx',
  'app/(tabs)/profile.tsx',
  'app/post/create.tsx',
  'app/chat/[id].tsx',
  'app/listing/create.tsx',
  'app/project/create.tsx',
  'app/notifications.tsx',
  'app/plans.tsx',
  'services/app.ts',
  'lib/supabase.ts',
];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Arquivo obrigatório ausente: ${file}`);
  const text = fs.readFileSync(full, 'utf8');
  if (text.trim().length < 200) throw new Error(`Arquivo parece incompleto: ${file}`);
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
if (packageJson.main !== 'expo-router/entry') throw new Error('Expo Router não configurado.');
if (appJson.expo.scheme !== 'possivel') throw new Error('Deep link possivel:// não configurado.');
const allCode = required.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
for (const forbidden of ['TODO: implementar', 'Lorem ipsum']) {
  if (allCode.includes(forbidden)) throw new Error(`Conteúdo incompleto/fictício encontrado: ${forbidden}`);
}
console.log('mobile static check: ok');
