import { describe, expect, it, vi } from 'vitest';
import { SazitoCheckout } from '../src/server';

describe('SazitoCheckout server handlers', () => {
  it('redirects an empty payment-in-place POST for one browser-side finalization', async () => {
    const customFetchApi = vi.fn() as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      checkoutPath: '/checkout',
      customFetchApi
    });
    const request = new Request(
      'https://shop.example.com/checkout/paymentinplaceresult/payment/304/identifier/payment-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: ''
      }
    );

    const response = await handlers.POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://shop.example.com/checkout?sazito_payment_return=callback&sazito_payment_id=304&sazito_payment_identifier=payment-token'
    );
    expect(customFetchApi).not.toHaveBeenCalled();
  });

  it('keeps server verification for payment-in-place callbacks carrying fields', async () => {
    const customFetchApi = vi.fn(async () => new Response(JSON.stringify({
      result: { action: 'show_order', order: {
        id: 1,
        order_number: 'OR1',
        order_identifier: 'order-token',
        invoice: { invoice_items: [], shipping_items: [] }
      } }
    }), { headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      customFetchApi
    });

    const response = await handlers.POST(new Request(
      'https://shop.example.com/checkout/paymentinplaceresult/payment/304/identifier/payment-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'code=ok'
      }
    ));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('sazito_payment_return=status');
    expect(customFetchApi).toHaveBeenCalledTimes(2);
    expect(customFetchApi).toHaveBeenNthCalledWith(
      1,
      'http://api.sazito.com:8080/api/v2/payments/304/process_payment_step',
      expect.anything()
    );
    expect(customFetchApi).toHaveBeenNthCalledWith(
      2,
      'http://api.sazito.com:8080/api/v1/pinch/order',
      expect.anything()
    );
  });

  it('verifies a gateway POST and redirects to the checkout status return', async () => {
    let backendRequest: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const customFetchApi = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      backendRequest = { input, init };
      return new Response(JSON.stringify({
        result: { action: 'FAIL', message: 'cancelled' }
      }), { headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      checkoutPath: '/checkout',
      customFetchApi
    });
    const request = new Request(
      'https://shop.example.com/checkout/zibalpaymentresult/payment/304/identifier/payment-token?RefId=query-value',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'RefId=body-value&Status=OK'
      }
    );

    const response = await handlers.POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('location')).toBe(
      'https://shop.example.com/checkout?sazito_payment_return=status&sazito_payment_id=304&sazito_payment_identifier=payment-token'
    );
    expect(customFetchApi).toHaveBeenCalledOnce();

    const form = new URLSearchParams(String(backendRequest?.init?.body));
    expect(form.get('payload[RefId]')).toBe('query-value');
    expect(form.get('payload[Status]')).toBe('OK');
    expect(form.get('payment_identifier')).toBe('payment-token');
  });

  it('supports gateway GET callbacks through the same handler pair', async () => {
    const customFetchApi = vi.fn(async () => new Response(JSON.stringify({
      result: { action: 'FAIL' }
    }), { headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      checkoutPath: '/fa/checkout',
      customFetchApi
    });

    const response = await handlers.GET(new Request(
      'https://shop.example.com/checkout/zarinpalpaymentresult/payment/91/identifier/pi-91?Status=NOK'
    ));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://shop.example.com/fa/checkout?sazito_payment_return=status&sazito_payment_id=91&sazito_payment_identifier=pi-91'
    );
  });

  it('rejects malformed callback paths before contacting the API', async () => {
    const customFetchApi = vi.fn() as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      customFetchApi
    });

    const response = await handlers.POST(new Request(
      'https://shop.example.com/checkout/not-a-payment-callback',
      { method: 'POST', body: 'Status=OK' }
    ));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_payment_callback' });
    expect(customFetchApi).not.toHaveBeenCalled();
  });

  it('rejects callback bodies above the configured limit', async () => {
    const customFetchApi = vi.fn() as typeof fetch;
    const { handlers } = SazitoCheckout({
      domain: 'shop.example.com',
      maxCallbackBodyBytes: 4,
      customFetchApi
    });

    const response = await handlers.POST(new Request(
      'https://shop.example.com/checkout/zibalpaymentresult/payment/304/identifier/payment-token',
      { method: 'POST', body: 'Status=OK' }
    ));

    expect(response.status).toBe(413);
    expect(customFetchApi).not.toHaveBeenCalled();
  });
});
