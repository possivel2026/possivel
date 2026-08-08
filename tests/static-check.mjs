import fs from 'node:fs';
import path from 'node:path';

const required = [
  'index.html',
  'styles.css',
  'enhancements.css',
  'script.js',
  'enhancements.js',
  'supabase-config.js',
  'supabase-schema.sql',
  'SECURITY.md',
  'supabase/functions/possivel-ai/index.ts',
  'supabase/migrations/202608080001_ai_security_hardening.sql',
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Arquivo ausente: ${file}`);
}

const html = fs.readFileSync('index.html', 'utf8');
for (const id of ['feedList', 'authDialog', 'composeDialog', 'commentsDialog', 'marketList', 'causesList', 'aiDialog']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Elemento obrigatório ausente: ${id}`);
}

if ((html.match(/@supabase\/supabase-js@2/g) || []).length !== 1) throw new Error('Supabase CDN deve aparecer uma vez.');
if (!html.includes('Content-Security-Policy')) throw new Error('CSP ausente no site.');
if (!html.includes('R$ 29,99/mês')) throw new Error('Preço público do Possível Pro incorreto.');
if (html.includes('sample-bike') || html.includes('Ana Martin') || html.includes('João Silva')) throw new Error('Dados fictícios encontrados.');

const config = fs.readFileSync('supabase-config.js', 'utf8');
if (/service_role|secret_key/i.test(config)) throw new Error('Segredo proibido no frontend.');
if (!config.includes("aiFunctionName: 'possivel-ai'")) throw new Error('Possível IA não configurada no frontend.');
if (!config.includes("proPriceLabel: 'R$ 29,99/mês'")) throw new Error('Preço do plano não está centralizado no frontend.');

const plans = fs.readFileSync('supabase/functions/_shared/plans.ts', 'utf8');
if (!plans.includes('PRO_MONTHLY_PRICE_BRL = 29.99')) throw new Error('Preço do plano no backend está incorreto.');

const hardening = fs.readFileSync('supabase/migrations/202608080001_ai_security_hardening.sql', 'utf8');
for (const marker of ['is_blocked_pair', 'consume_daily_feature', 'enforce_insert_rate_limit', 'payments_insert_own']) {
  if (!hardening.includes(marker)) throw new Error(`Hardening incompleto: ${marker}`);
}

for (const obsolete of ['netlify.toml', 'vercel.json', '_headers']) {
  if (fs.existsSync(obsolete)) throw new Error(`Configuração de hospedagem obsoleta ainda presente: ${obsolete}`);
}

const frontendFiles = ['index.html', 'script.js', 'enhancements.js', 'supabase-config.js'];
const frontend = frontendFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
if (/MERCADO_PAGO_ACCESS_TOKEN|DAILY_API_KEY|SUPABASE_SERVICE_ROLE_KEY|AI_API_KEY/.test(frontend)) {
  throw new Error('Nome de secret privado encontrado no frontend.');
}

function collectTextFiles(dir = '.') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTextFiles(full));
    else if (/\.(?:html|js|mjs|ts|tsx|md|json|sql|css|toml|yml|yaml)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const oldOwner = ['marcelinfreefire153', 'arch'].join('-');
for (const file of collectTextFiles()) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(oldOwner)) throw new Error(`URL antiga encontrada em ${file}`);
}

console.log('Validação estática concluída.');
