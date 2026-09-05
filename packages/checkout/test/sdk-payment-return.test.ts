import { describe, expect, it, vi } from 'vitest';
import { createSazitoClient } from '../../../src/index';
import type { InvoiceItem, Order, OrderInvoiceItem } from '../../../src/index';

describe('PaymentsAPI gateway return', () => {
  it('creates payment credentials from both nested and direct v2 response shapes', async () => {
    const responses = [
      { result: { payment: { id: 324, payment_identifier: 'nested-token', payment_amount: 10000, payment_type: { id: 3, reference_code: 'paymentinplace' } } } },
      { result: { id: 325, payment_identifier: 'direct-token', payment_amount: 10000, payment_type: { id: 3, reference_code: 'paymentinplace' } } }
    ];

    for (const body of responses) {
      const requestBodies: unknown[] = [];
      const client = createSazitoClient({
        domain: 'shop.example.com',
        customFetchApi: async (_input, init) => {
          requestBodies.push(JSON.parse(String(init?.body)));
          return new Response(JSON.stringify(body), {
            headers: { 'content-type': 'application/json' }
          });
        }
      });
      client.getCredentialsManager().setInvoiceCredentials({ id: 338, identifier: 'invoice-token' });

      const response = await client.payments.create(3);
      expect(response.error).toBeUndefined();
      expect(response.data?.id).toBe(body.result.payment?.id ?? body.result.id);
      expect(response.data?.identifier).toBe(body.result.payment?.payment_identifier ?? body.result.payment_identifier);
      expect(requestBodies[0]).toEqual({ invoice_identifier: 'invoice-token', payment_type: 3 });
    }
  });

  it('reports an actionable error when payment creation has no usable credentials', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({ result: { payment: { id: 0, payment_identifier: '' } } }), {
        headers: { 'content-type': 'application/json' }
      })
    });
    client.getCredentialsManager().setInvoiceCredentials({ id: 338, identifier: 'invoice-token' });

    const response = await client.payments.create(3);
    expect(response.error).toMatchObject({
      type: 'api',
      message: 'Payment creation response is missing a valid payment ID or identifier.'
    });
  });

  it('accepts the identifier-scoped zero ID returned by v2 payment creation', async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const responses = [
      {
        result: {
          payment: {
            id: 0,
            payment_identifier: 'v2-payment-token',
            payment_amount: 840000,
            payment_type: { id: 3, reference_code: 'paymentinplace' }
          }
        },
        error: '',
        error_code: 0,
        status: 0
      },
      {
        result: {
          order: null,
          action: 'POST',
          address: 'https://shop.example.com/checkout/paymentinplaceresult/payment/325/identifier/v2-payment-token',
          payload: {}
        },
        error: '',
        error_code: 0,
        status: 0
      }
    ];
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify(responses.shift()), {
          headers: {
            'content-type': requests.length === 1
              ? 'application/json'
              : 'text/plain'
          }
        });
      }
    });
    client.getCredentialsManager().setInvoiceCredentials({ id: 0, identifier: 'invoice-token' });

    const created = await client.payments.create(3);
    const initialized = await client.payments.initialize();

    expect(created.error).toBeUndefined();
    expect(created.data).toMatchObject({ id: 0, identifier: 'v2-payment-token' });
    expect(client.getCredentialsManager().getPaymentCredentials()).toEqual({
      id: 0,
      identifier: 'v2-payment-token'
    });
    expect(initialized.data).toMatchObject({
      action: 'POST',
      address: expect.stringContaining('/payment/325/identifier/v2-payment-token')
    });
    expect(requests.map(({ input }) => String(input))).toEqual([
      'http://api.sazito.com:8080/api/v2/payments',
      'http://api.sazito.com:8080/api/v2/payments/0/process_payment_step'
    ]);
    expect(JSON.parse(String(requests[1]?.init?.body))).toEqual({
      payment_identifier: 'v2-payment-token'
    });
  });

  it.each([null, undefined])('accepts a confirmed simple-product order with attributes %s', async (attributes) => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({
        result: {
          action: 'show_order',
          order: {
            id: 265, order_number: 'OR0000000265', order_identifier: 'order-token',
            invoice: {
              invoice_items: [{
                id: 761, name: 'Zishop', no_of_items: 1,
                product_variant: { id: 1051, product: { product_type: 'simple' } },
                variant_attributes: attributes,
                single_item_price: 840000, total_items_price: 840000
              }],
              shipping_items: [], net_total: 840000, final_total: 840000
            }
          }
        }, error: '', error_code: 0, status: 0
      }), { headers: { 'content-type': 'application/json' } })
    });
    const response = await client.payments.verify({ id: 324, paymentIdentifier: 'payment-token' });
    expect(response.error).toBeUndefined();
    expect(response.data).toMatchObject({
      action: 'show_order', order: {
        id: 265, invoice: { invoiceItems: [{ productVariantId: 1051, variantAttributes: [] }] }
      }
    });
  });

  it.each(['initialize', 'getPaymentStep', 'verify'] as const)(
    'sends %s through the identifier-scoped v2 zero route', async (method) => {
      const fetchApi = vi.fn(async () => new Response(JSON.stringify({
        result: { action: 'FAIL' }
      }), { headers: { 'content-type': 'application/json' } }));
      const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
      client.getCredentialsManager().setPaymentCredentials({ id: 0, identifier: 'payment-token' });
      const response = await client.payments[method]();
      expect(response.error).toBeUndefined();
      expect(response.data?.action).toBe('FAIL');
      expect(fetchApi).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/v2/payments/0/process_payment_step',
        expect.anything()
      );
    }
  );

  it('does not use the initialization ID for form callback processing', async () => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    client.getCredentialsManager().setPaymentCredentials({ id: 0, identifier: 'payment-token' });

    const response = await client.payments.processStepForm({ ResCode: '0' });

    expect(response.error).toMatchObject({
      type: 'validation',
      message: 'A positive payment ID is required for form callback processing.'
    });
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it('uses callback ID 324 even if a zero ID is stored', async () => {
    const fetchApi = vi.fn(async () => new Response(JSON.stringify({ result: { action: 'FAIL' } })));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    client.getCredentialsManager().setPaymentCredentials({ id: 0, identifier: 'payment-token' });
    await client.payments.verify({ id: 324, paymentIdentifier: 'payment-token' });
    expect(fetchApi).toHaveBeenCalledWith(
      'http://api.sazito.com:8080/api/v2/payments/324/process_payment_step', expect.anything()
    );
    expect(client.getCredentialsManager().getPaymentCredentials()?.id).toBe(324);
  });

  it('rejects zero as an explicit gateway-return payment ID', async () => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });

    const response = await client.payments.verify({
      id: 0,
      paymentIdentifier: 'callback-payment-token'
    });

    expect(response.error).toMatchObject({
      type: 'validation',
      message: 'Invalid payment callback credentials.'
    });
    expect(fetchApi).not.toHaveBeenCalled();
  });

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
      image_url: 'https://cdn.example.com/receipt.jpg',
      code: 'cancelled',
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
    expect(form.get('RefId')).toBe('query+value&more');
    expect(form.get('ResCode')).toBe('0');
    expect(form.get('unicode')).toBe('پرداخت');
    expect(form.get('payment_identifier')).toBe('pi_abc');
    expect([...form.keys()].some((key) => key.startsWith('payload['))).toBe(false);
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
                      id: '15',
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

  it('derives the invoice item variant ID from the real nested backend shape', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({ result: {
        action: 'show_order',
        order: {
          id: 123,
          order_number: 'OR0000000123',
          order_identifier: 'order-token',
          invoice: {
            invoice_items: [{
              id: 91,
              name: 'Red shoes',
              variant_attributes: [],
              no_of_items: 1,
              single_item_price: 240000,
              total_items_price: 240000,
              product_variant: {
                id: 15,
                commercial_files: [],
                product: { product_type: 'physical' }
              }
            }],
            shipping_items: []
          }
        }
      } }), { headers: { 'Content-Type': 'application/json' } })
    });

    const response = await client.payments.verify({
      id: 304,
      paymentIdentifier: 'payment-token'
    });

    expect(response.error).toBeUndefined();
    expect(response.data).toMatchObject({
      action: 'show_order',
      order: {
        invoice: {
          invoiceItems: [{ productVariantId: 15 }]
        }
      }
    });
  });

  it('accepts the final payment-in-place success response with null order collections', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input) => {
        if (String(input).includes('/pinch/order')) {
          return new Response(JSON.stringify({ result: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({
          result: {
            order: {
              id: 3216,
              order_identifier: '5e02e1bff83bb0f43273ee696245c139',
              order_number: 'OR0000003216',
              invoice: {
                id: 0,
                invoice_identifier: '',
                invoice_items: null,
                shipping_items: null,
                net_total: 0,
                final_total: 0,
                discount_usages: null,
                receipts: null
              },
              order_comments: null,
              editions: []
            },
            action: 'show_order',
            address: '',
            payload: null,
            time: 0,
            message: null
          },
          error: '',
          error_code: 0,
          status: 0
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    });

    const response = await client.payments.verify({
      id: 3727,
      paymentIdentifier: '0ef922a0adeb3288cdf170f5b7d2d311'
    });

    expect(response.error).toBeUndefined();
    expect(response.data).toMatchObject({
      action: 'show_order',
      order: {
        id: 3216,
        orderNumber: 'OR0000003216',
        orderIdentifier: '5e02e1bff83bb0f43273ee696245c139',
        invoice: {
          invoiceItems: [],
          shippingItems: [],
          netTotal: 0,
          finalTotal: 0
        }
      }
    });
  });

  it('accepts the final payment failure response with a null order', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({
        result: {
          order: null,
          action: 'payment_fail_error',
          address: '',
          payload: null,
          time: 0,
          message: null
        },
        error: '',
        error_code: 0,
        status: 0
      }), { headers: { 'Content-Type': 'application/json' } })
    });

    const response = await client.payments.verify({
      id: 3728,
      paymentIdentifier: 'failed-payment'
    });

    expect(response.error).toBeUndefined();
    expect(response.data).toMatchObject({ action: 'payment_fail_error' });
  });

  it('unwraps a storefront proxy response log before reading the payment action', async () => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({
        method: 'POST',
        path: '/api/v2/payments/3728/process_payment_step',
        response: {
          result: {
            order: null,
            action: 'payment_fail_error',
            address: '',
            format: '',
            payload: null,
            time: 0,
            callback: '',
            token: '',
            RedeemToken: '',
            IsInitialize: false,
            message: null
          },
          error: '',
          error_code: 0,
          status: 0
        }
      }), { headers: { 'Content-Type': 'application/json' } })
    });

    const response = await client.payments.verify({
      id: 3728,
      paymentIdentifier: 'failed-payment'
    });

    expect(response.error).toBeUndefined();
    expect(response.data).toMatchObject({ action: 'payment_fail_error' });
  });

  it('logs every payment verification parsing stage in SDK debug mode', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const client = createSazitoClient({
      domain: 'shop.example.com',
      debug: true,
      customFetchApi: async () => new Response(JSON.stringify({
        result: { order: null, action: 'payment_fail_error', message: null },
        error: '',
        error_code: 0,
        status: 0
      }), { headers: { 'Content-Type': 'application/json' } })
    });

    await client.payments.verify({ id: 3728, paymentIdentifier: 'sensitive-payment-id' });

    const stages = debug.mock.calls.map(([message]) => String(message));
    expect(stages).toEqual(expect.arrayContaining([
      expect.stringContaining('started'),
      expect.stringContaining('request_prepared'),
      expect.stringContaining('response_received'),
      expect.stringContaining('envelope_unwrapped'),
      expect.stringContaining('action_extracted'),
      expect.stringContaining('action_normalized'),
      expect.stringContaining('pinch_skipped'),
      expect.stringContaining('finished')
    ]));
    expect(JSON.stringify(debug.mock.calls)).not.toContain('sensitive-payment-id');
    debug.mockRestore();
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

  it('uses the Sazito API origin and v2 payment verification path by default', async () => {
    let requestUrl = '';
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async (input) => {
        requestUrl = String(input);
        return new Response(JSON.stringify({
          result: { action: 'payment_fail_error', order: null },
          error: '',
          error_code: 0,
          status: 0
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    });

    await client.payments.verify({
      id: 3728,
      paymentIdentifier: 'payment-token'
    });

    expect(requestUrl).toBe(
      'http://api.sazito.com:8080/api/v2/payments/3728/process_payment_step'
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
