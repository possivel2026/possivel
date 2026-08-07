import { describe, expect, it } from 'vitest';
import { validateMercadoPagoWebhookSignature } from '../../supabase/functions/_shared/webhook-signature';

async function hmac(secret: string, manifest: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('Mercado Pago webhook signature', () => {
  it('rejects an invalid webhook signature', async () => {
    await expect(
      validateMercadoPagoWebhookSignature({ signature: 'ts=1742505638683,v1=invalid', requestId: 'request-1', eventId: 'evt-1', secret: 'secret' }),
    ).rejects.toThrow('Assinatura');
  });

  it('accepts a valid webhook signature', async () => {
    const ts = '1742505638683';
    const requestId = 'request-1';
    const eventId = 'evt-1';
    const secret = 'secret';
    const signature = await hmac(secret, `id:${eventId};request-id:${requestId};ts:${ts};`);

    await expect(
      validateMercadoPagoWebhookSignature({ signature: `ts=${ts},v1=${signature}`, requestId, eventId, secret }),
    ).resolves.toBeUndefined();
  });
});
