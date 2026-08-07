export class InvalidWebhookSignatureError extends Error {
  constructor(message = 'Assinatura do webhook inválida') {
    super(message);
    this.name = 'InvalidWebhookSignatureError';
  }
}

function parseSignature(signature: string) {
  return Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    }),
  );
}

function bytesToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export function getMercadoPagoEventId(url: string) {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams.get('data.id') ?? parsedUrl.searchParams.get('data_id') ?? parsedUrl.searchParams.get('id') ?? '';
}

export async function validateMercadoPagoWebhookSignature(input: {
  signature: string | null;
  requestId: string | null;
  eventId: string | null;
  secret: string | undefined;
}) {
  const { signature, requestId, eventId, secret } = input;
  if (!signature || !requestId || !eventId || !secret) {
    throw new InvalidWebhookSignatureError('Webhook Mercado Pago sem assinatura, request-id, evento ou segredo');
  }

  const parsedSignature = parseSignature(signature);
  const ts = parsedSignature.ts;
  const v1 = parsedSignature.v1;

  if (!ts || !v1) {
    throw new InvalidWebhookSignatureError('Cabeçalho x-signature inválido');
  }

  const manifest = `id:${eventId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const expected = bytesToHex(digest);

  if (!timingSafeEqual(expected, v1)) {
    throw new InvalidWebhookSignatureError();
  }
}
