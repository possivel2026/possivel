import fs from 'node:fs';
const required = ['index.html','styles.css','script.js','supabase-config.js','supabase-schema.sql'];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Arquivo ausente: ${file}`);
}
const html = fs.readFileSync('index.html','utf8');
for (const id of ['feedList','authDialog','composeDialog','commentsDialog','marketList','causesList']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Elemento obrigatório ausente: ${id}`);
}
if ((html.match(/@supabase\/supabase-js@2/g) || []).length !== 1) throw new Error('Supabase CDN deve aparecer uma vez.');
if (html.includes('sample-bike') || html.includes('Ana Martin') || html.includes('João Silva')) throw new Error('Dados fictícios encontrados.');
const config = fs.readFileSync('supabase-config.js','utf8');
if (/service_role|secret_key/i.test(config)) throw new Error('Segredo proibido no frontend.');
console.log('Validação estática concluída.');
