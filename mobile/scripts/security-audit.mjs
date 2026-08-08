import { spawnSync } from 'node:child_process';

const knownUpstream = new Map([
  ['GHSA-w3rx-r6r6-pgpr', 'image-size / Metro: parser ICNS pode entrar em loop; sem versão corrigida disponível no momento.'],
  ['GHSA-5p2g-fcmc-qvqq', 'image-size / Metro: parsers JXL/HEIF podem entrar em loop; sem versão corrigida disponível no momento.'],
  ['GHSA-w5hq-g745-h8pq', 'uuid transitivo do tooling de build Expo/xcode; severidade moderada.'],
]);

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(audit.stdout || '{}');
} catch (error) {
  console.error('Não foi possível interpretar o resultado do npm audit.');
  console.error(audit.stderr || error);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities || {};
const advisoryFromUrl = (url = '') => String(url).match(/GHSA-[A-Za-z0-9-]+/)?.[0] || null;

function resolveAdvisories(packageName, seen = new Set()) {
  if (seen.has(packageName)) return [];
  seen.add(packageName);

  const vulnerability = vulnerabilities[packageName];
  if (!vulnerability) return [{ id: `unknown:${packageName}`, severity: 'unknown', packageName }];

  const resolved = [];
  for (const via of vulnerability.via || []) {
    if (typeof via === 'string') {
      resolved.push(...resolveAdvisories(via, new Set(seen)));
      continue;
    }

    const id = advisoryFromUrl(via?.url);
    resolved.push({
      id: id || `unknown:${packageName}:${via?.source ?? via?.title ?? 'advisory'}`,
      severity: via?.severity || vulnerability.severity || 'unknown',
      packageName,
      title: via?.title || '',
      url: via?.url || '',
    });
  }

  if (!resolved.length && ['high', 'critical'].includes(vulnerability.severity)) {
    resolved.push({ id: `unknown:${packageName}`, severity: vulnerability.severity, packageName });
  }
  return resolved;
}

const criticalPackages = Object.entries(vulnerabilities)
  .filter(([, item]) => item?.severity === 'critical')
  .map(([name]) => name);

if (criticalPackages.length) {
  console.error(`Auditoria bloqueada: vulnerabilidade crítica em ${criticalPackages.join(', ')}.`);
  process.exit(1);
}

const highPackages = Object.entries(vulnerabilities)
  .filter(([, item]) => item?.severity === 'high')
  .map(([name]) => name);

const highLeaves = highPackages.flatMap((name) => resolveAdvisories(name));
const unexpectedHigh = highLeaves.filter((item) => item.severity === 'high' && !knownUpstream.has(item.id));
const unknownHigh = highLeaves.filter((item) => item.id.startsWith('unknown:'));

if (unexpectedHigh.length || unknownHigh.length) {
  console.error('Auditoria bloqueada: surgiu vulnerabilidade alta não aprovada pela política temporária.');
  for (const item of [...unexpectedHigh, ...unknownHigh]) {
    console.error(`- ${item.id} · ${item.packageName}${item.title ? ` · ${item.title}` : ''}`);
  }
  process.exit(1);
}

const observedIds = new Set();
for (const name of Object.keys(vulnerabilities)) {
  for (const item of resolveAdvisories(name)) {
    if (knownUpstream.has(item.id)) observedIds.add(item.id);
  }
}

if (observedIds.size) {
  console.warn('Avisos upstream conhecidos no tooling de build (monitorados, não ignorados silenciosamente):');
  for (const id of observedIds) console.warn(`- ${id}: ${knownUpstream.get(id)}`);
}

const counts = report.metadata?.vulnerabilities || {};
console.log(`npm audit: critical=${counts.critical ?? 0}, high=${counts.high ?? 0}, moderate=${counts.moderate ?? 0}, low=${counts.low ?? 0}`);
console.log('Gate de segurança aprovado: nenhuma vulnerabilidade crítica e nenhuma vulnerabilidade alta nova fora da lista upstream documentada.');
