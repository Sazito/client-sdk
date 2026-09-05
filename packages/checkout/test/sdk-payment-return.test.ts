import { describe, expect, it, vi } from 'vitest';
import { createSazitoClient } from '../../../src/index';
import type { InvoiceItem, Order, OrderInvoiceItem } from '../../../src/index';

describe('PaymentsAPI gateway return', () => {
  it('keeps order invoice items compatible with the established InvoiceItem type', () => {
    const orderItem: OrderInvoiceItem = {
      id: 91,
      productVariantId: 15,
      name: 'Red shoes',
      attributes: [],
      quantity: 1,
      unitPrice: 240000,
      lineTotal: 240000,
      rawPrice: 240000,
      customerProfit: 0
    };
    const invoiceItems: InvoiceItem[] = [orderItem];
    const legacyOrder: Order = {
      id: 123,
      orderNumber: '10001',
      orderIdentifier: 'order-token',
      invoice: {
        invoiceItems: [orderItem],
        shippingItems: []
      }
    };

    expect(invoiceItems[0].id).toBe(91);
    expect(legacyOrder.invoice.invoiceItems).toEqual(invoiceItems);
  });

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
      imageUrl: 'https://cdn.example.com/receipt.jpg',
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
    expect(new Headers(request?.init?.headers).get('content-type')).toBe(
      'application/x-www-form-urlencoded;charset=UTF-8'
    );
    const form = new URLSearchParams(String(request?.init?.body));
    expect(Object.fromEntries(form)).toEqual({
      'payload[imageUrl]': 'https://cdn.example.com/receipt.jpg',
      'payload[code]': 'cancelled',
      payment_identifier: 'callback-payment'
    });
  });

  it('preserves callback names, encoding, and query-over-body precedence', async () => {
    let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input, init) => {
        request = { input, init };
        return new Response(JSON.stringify({ result: {
          action: 'future_backend_action', metadata: { version: 2 }
        } }), { headers: { 'Content-Type': 'application/json' } });
      }
    });

    const response = await client.payments.verifyPaymentCallback({
      paymentId: '789',
      paymentIdentifier: ' pi_abc ',
      body: { RefId: 'body value', ResCode: '0', unicode: 'پرداخت' },
      query: { RefId: 'query+value&more', payment_identifier: 'untrusted' }
    });

    expect(response.data).toEqual({
      action: 'unknown',
      backendAction: 'future_backend_action',
      raw: { action: 'future_backend_action', metadata: { version: 2 } },
      message: undefined
    });
    const form = new URLSearchParams(String(request?.init?.body));
    expect(form.get('payload[RefId]')).toBe('query+value&more');
    expect(form.get('payload[ResCode]')).toBe('0');
    expect(form.get('payload[unicode]')).toBe('پرداخت');
    expect(form.get('payload[payment_identifier]')).toBe('untrusted');
    expect(form.get('payment_identifier')).toBe('pi_abc');
  });

  it.each([
    ['show_order', 'text/plain'],
    ['pending', 'application/json']
  ])('normalizes %s with its own checkout order contract (%s)', async (action, contentType) => {
    const fetchApi = vi.fn(async () =>
      new Response(
        JSON.stringify({
          result: {
            action,
            order: {
              id: '123',
              order_number: 10001,
              order_identifier: 'order-token',
              invoice: {
                invoice_items: [
                  {
                    product_variant_id: '15',
                    name: 'Red shoes',
                    image: { url: 'https://cdn.example.com/red-shoes.jpg' },
                    variant_attributes: [{ name: 'Color', value: 'Red' }],
                    no_of_items: 1,
                    single_item_price: 240000,
                    total_items_price: 240000,
                    customer_profit: 10000,
                    form_attributes: { gift: true },
                    booking_attributes: { slot: 'morning' },
                    product_variant: {
                      commercial_files: [{ id: 'file-1' }],
                      product: { product_type: 'physical' }
                    }
                  }
                ],
                shipping_items: [
                  {
                    id: 'shipment-1',
                    invoice_item_ids: [91],
                    rate: {
                      id: 'rate-12',
                      name: 'Post',
                      price: 25000,
                      type: 'post',
                      color: '#0ea5e9',
                      icon: 'https://cdn.example.com/post.svg'
                    }
                  }
                ],
                net_total: 240000,
                final_total: 250000,
                shipping_total: 25000,
                discount_total: 10000,
                credit_total: 5000,
                vat: 0,
                vat_percent: 0,
                items_discount: 10000,
                items_total_raw_price: 250000,
                customer_profit: 10000,
                customer_profit_percentage: 4,
                discount_usages: [{ discount_code: { code: 'SAVE10' } }]
              }
            }
          },
          error: '',
          error_code: 0,
          status: 200
        }),
        { status: 200, headers: { 'Content-Type': contentType } }
      )
    ) as typeof fetch;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: fetchApi
    });

    const response = await client.payments.verify({
      id: 304,
      paymentIdentifier: 'callback-payment'
    });

    expect(response.data).toMatchObject({
      action,
      order: {
        id: '123',
        orderNumber: 10001,
        orderIdentifier: 'order-token',
        invoice: {
          invoiceItems: [
            {
              productVariantId: '15',
              name: 'Red shoes',
              image: { url: 'https://cdn.example.com/red-shoes.jpg' },
              variantAttributes: [{ name: 'Color', value: 'Red' }],
              noOfItems: 1,
              singleItemPrice: 240000,
              totalItemsPrice: 240000,
              customerProfit: 10000,
              formAttributes: { gift: true },
              bookingAttributes: { slot: 'morning' },
              productVariant: {
                commercialFiles: [{ id: 'file-1' }],
                product: { productType: 'physical' }
              }
            }
          ],
          shippingItems: [
            {
              id: 'shipment-1',
              invoiceItemIds: [91],
              rate: {
                id: 'rate-12',
                name: 'Post',
                price: 25000,
                type: 'post',
                color: '#0ea5e9',
                icon: 'https://cdn.example.com/post.svg'
              }
            }
          ],
          netTotal: 240000,
          finalTotal: 250000,
          shippingTotal: 25000,
          discountTotal: 10000,
          creditTotal: 5000,
          vat: 0,
          vatPercent: 0,
          itemsDiscount: 10000,
          itemsTotalRawPrice: 250000,
          customerProfit: 10000,
          customerProfitPercentage: 4,
          discountUsages: [{ discountCode: { code: 'SAVE10' } }]
        }
      }
    });
    if (response.data?.action === 'show_order' || response.data?.action === 'pending') {
      const item = response.data.order.invoice.invoiceItems[0];
      expect(item).not.toHaveProperty('id');
      expect(item).not.toHaveProperty('rawPrice');
      expect(item).not.toHaveProperty('quantity');
    }
  });

  it.each(['show_order', 'pending'])('accepts the SSR order shape when totals are omitted for %s', async (action) => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({ result: {
        action,
        order: {
          id: 123, order_number: '10001', order_identifier: 'order-token',
          invoice: { invoice_items: [], shipping_items: [] }
        }
      } }), { headers: { 'Content-Type': 'application/json' } })
    });
    const response = await client.payments.verify({ id: 304, paymentIdentifier: 'payment-token' });
    expect(response.data).toMatchObject({
      action,
      order: {
        id: 123,
        orderNumber: '10001',
        orderIdentifier: 'order-token',
        invoice: { invoiceItems: [], shippingItems: [] }
      }
    });
    if (response.data?.action === 'show_order' || response.data?.action === 'pending') {
      expect(response.data.order.invoice.netTotal).toBeUndefined();
      expect(response.data.order.invoice.finalTotal).toBeUndefined();
    }
  });

  it('uses JSON with only the payment identifier for a status request', async () => {
    let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input, init) => {
        request = { input, init };
        return new Response(JSON.stringify({ result: { action: 'payment_fail_error' } }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    });
    client.getCredentialsManager().setPaymentCredentials({ id: 789, identifier: 'pi_abc' });

    const response = await client.payments.getPaymentStep();

    expect(response.data?.action).toBe('payment_fail_error');
    expect(new Headers(request?.init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(request?.init?.body))).toEqual({ payment_identifier: 'pi_abc' });
  });

  it('supports a configured API origin and payments base path', async () => {
    let requestUrl = '';
    const client = createSazitoClient({
      domain: 'shop.example.com',
      apiBaseUrl: 'https://payments-api.example.com/',
      paymentsBasePath: '/custom/v2/payments',
      customFetchApi: async (input) => {
        requestUrl = String(input);
        return new Response(JSON.stringify({ result: { action: 'FAIL' } }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    });

    await client.payments.verifyPaymentCallback({
      paymentId: 789,
      paymentIdentifier: 'pi_abc'
    });

    expect(requestUrl).toBe(
      'https://payments-api.example.com/custom/v2/payments/789/process_payment_step'
    );
  });

  it('cancels polling before making a request', async () => {
    const fetchApi = vi.fn() as unknown as typeof fetch;
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    client.getCredentialsManager().setPaymentCredentials({ id: 789, identifier: 'pi_abc' });
    const controller = new AbortController();
    controller.abort();

    const response = await client.payments.pollUntilSettled({ signal: controller.signal });

    expect(response.error?.message).toBe('Payment verification cancelled.');
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it('polls with JSON until a pending payment becomes successful', async () => {
    const stepBodies: string[] = [];
    let stepAttempt = 0;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input, init) => {
        if (String(input).includes('/pinch/order')) {
          return new Response(JSON.stringify({ result: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        stepBodies.push(String(init?.body));
        stepAttempt += 1;
        const result = stepAttempt === 1
          ? { action: 'pending', order: {
              id: 1, order_number: '10001', order_identifier: 'order-token',
              invoice: { invoice_items: [], shipping_items: [] }
            } }
          : { action: 'show_order', order: {
              id: 1, order_number: '10001', order_identifier: 'order-token',
              invoice: { invoice_items: [], shipping_items: [] }
            } };
        return new Response(JSON.stringify({ result }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    });
    client.getCredentialsManager().setPaymentCredentials({ id: 789, identifier: 'pi_abc' });

    const response = await client.payments.pollUntilSettled({
      immediate: true,
      intervalMs: 0,
      maxAttempts: 3
    });

    expect(response.data?.action).toBe('show_order');
    expect(stepBodies.map((body) => JSON.parse(body))).toEqual([
      { payment_identifier: 'pi_abc' },
      { payment_identifier: 'pi_abc' }
    ]);
  });

  it('rejects malformed success results that omit required order identifiers', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({ result: {
        action: 'show_order',
        order: { id: 123, invoice: { invoice_items: [], shipping_items: [] } }
      } }), { headers: { 'Content-Type': 'application/json' } })
    });

    const response = await client.payments.verify({
      id: 304,
      paymentIdentifier: 'payment-token'
    });

    expect(response.error?.message).toBe('Invalid payment step result');
  });

  it('keeps pending action case and transforms the same required order shape', async () => {
    const fetchApi = vi.fn(async () =>
      new Response(
        JSON.stringify({
          result: {
            action: 'pending',
            order: {
              id: 123,
              order_number: '10001',
              order_identifier: 'order-token',
              invoice: {
                invoice_items: [],
                shipping_items: [],
                net_total: 100000,
                final_total: 110000
              }
            }
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as typeof fetch;
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: fetchApi
    });

    const response = await client.payments.verify({
      id: 304,
      paymentIdentifier: 'callback-payment'
    });

    expect(response.data).toEqual({
      action: 'pending',
      order: {
        id: 123,
        orderNumber: '10001',
        orderIdentifier: 'order-token',
        invoice: {
          invoiceItems: [],
          shippingItems: [],
          netTotal: 100000,
          finalTotal: 110000,
          shippingTotal: undefined,
          discountTotal: undefined,
          creditTotal: undefined,
          vat: undefined,
          vatPercent: undefined,
          itemsDiscount: undefined,
          itemsTotalRawPrice: undefined,
          customerProfit: undefined,
          customerProfitPercentage: undefined,
          discountUsages: undefined
        }
      },
      message: undefined,
      raw: {
        action: 'pending',
        order: {
          id: 123,
          order_number: '10001',
          order_identifier: 'order-token',
          invoice: {
            invoice_items: [],
            shipping_items: [],
            net_total: 100000,
            final_total: 110000
          }
        }
      }
    });
  });
});
