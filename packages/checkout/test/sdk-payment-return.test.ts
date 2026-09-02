import { describe, expect, it, vi } from 'vitest';
import { createSazitoClient } from '../../../src/index';

describe('PaymentsAPI gateway return', () => {
  it('verifies from callback credentials when storage is empty', async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchApi = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return new Response(
        JSON.stringify({ action: 'FAIL', message: 'cancelled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: fetchApi
    });

    const response = await client.payments.verify({
      id: 304,
      paymentIdentifier: 'callback-payment',
      code: 'cancelled'
    });

    expect(response.data?.action).toBe('FAIL');
    expect(client.getCredentialsManager().getPaymentCredentials()).toEqual({
      id: 304,
      identifier: 'callback-payment'
    });
    expect(fetchApi).toHaveBeenCalledOnce();

    const request = requests[0];
    expect(String(request?.input)).toContain('/payments/304/process_payment_step');
    expect(JSON.parse(String(request?.init?.body))).toEqual({
      payment_identifier: 'callback-payment',
      reference_code: 'cancelled'
    });
  });
});
