import { getMercadoPagoEventId, validateMercadoPagoWebhookSignature } from './webhook-signature.ts';

export type CheckoutInput = { userId: string; email?: string; plan: 'pro' };
export type CheckoutResult = { checkoutUrl: string; providerSubscriptionId?: string };
export type SubscriptionData = { id: string; status: string; external_reference?: string };
export type WebhookEvent = { id: string; type: string; providerSubscriptionId?: string; status?: string; payload: unknown };

export interface PaymentProvider {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionData>;
  validateWebhook(request: Request): Promise<WebhookEvent>;
}

function env(name: string) {
  return (globalThis as unknown as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno?.env.get(name);
}

export class MercadoPagoProvider implements PaymentProvider {
  private token = env('MERCADO_PAGO_ACCESS_TOKEN')!;
  private base = 'https://api.mercadopago.com';

  async createCheckoutSession(input: CheckoutInput) {
    const appUrl = env('APP_URL') ?? 'possivel://subscription/manage';
    const res = await fetch(`${this.base}/preapproval`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        reason: 'Possível Pro',
        external_reference: input.userId,
        payer_email: input.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(env('POSSIVEL_PRO_PRICE') ?? 19.9),
          currency_id: 'BRL',
        },
        back_url: appUrl,
        status: 'pending',
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    return { checkoutUrl: data.init_point ?? data.sandbox_init_point, providerSubscriptionId: data.id };
  }

  async cancelSubscription(id: string) {
    const res = await fetch(`${this.base}/preapproval/${id}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!res.ok) throw new Error(await res.text());
  }

  async getSubscription(id: string) {
    const res = await fetch(`${this.base}/preapproval/${id}`, { headers: { authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { id: data.id, status: data.status, external_reference: data.external_reference };
  }

  async validateWebhook(request: Request) {
    const eventId = getMercadoPagoEventId(request.url);

    await validateMercadoPagoWebhookSignature({
      signature: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      eventId,
      secret: env('MERCADO_PAGO_WEBHOOK_SECRET'),
    });

    const payload = await request.json();
    const id = String((payload as { id?: unknown }).id ?? eventId);
    const type = String((payload as { type?: unknown; action?: unknown }).type ?? (payload as { action?: unknown }).action ?? 'unknown');
    const providerSubscriptionId = (payload as { data?: { id?: unknown }; id?: unknown }).data?.id ?? (payload as { id?: unknown }).id;
    let status: string | undefined;

    if (providerSubscriptionId) {
      const sub = await this.getSubscription(String(providerSubscriptionId));
      status = sub.status;
    }

    return { id, type, providerSubscriptionId: String(providerSubscriptionId ?? ''), status, payload };
  }
}
