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
    expect(JSON.parse(String(request?.init?.body))).toEqual({
      payment_identifier: 'callback-payment',
      image_url: 'https://cdn.example.com/receipt.jpg',
      code: 'cancelled'
    });
  });

  it('normalizes a text/plain success response and its nested order', async () => {
    const fetchApi = vi.fn(async () =>
      new Response(
        JSON.stringify({
          result: {
            action: 'show_order',
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
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
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
      action: 'show_order',
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
      message: undefined
    });
  });
});
