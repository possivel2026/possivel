import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MercadoPagoProvider } from '../../supabase/functions/_shared/payment-provider';

describe('MercadoPagoProvider.cancelSubscription', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('Deno', { env: { get: (key: string) => (key === 'MERCADO_PAGO_ACCESS_TOKEN' ? 'token' : undefined) } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  it('throws when Mercado Pago rejects cancellation', async () => {
    globalThis.fetch = vi.fn(async () => new Response('erro mercado pago', { status: 500 })) as unknown as typeof fetch;

    await expect(new MercadoPagoProvider().cancelSubscription('sub_123')).rejects.toThrow('erro mercado pago');
  });

  it('confirms cancellation when Mercado Pago responds ok', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;

    await expect(new MercadoPagoProvider().cancelSubscription('sub_123')).resolves.toBeUndefined();
  });
});
