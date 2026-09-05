import { describe, expect, it } from 'vitest';
import { createSazitoClient } from '../../../src/index';
import type { CheckoutInvoice, CheckoutOrder, InvoiceItem, Order } from '../../../src/index';

// This is the account shape supported before payment completion was added.
const accountOrder: Order = {
  id: 123,
  orderNumber: '10001',
  orderIdentifier: 'order-token',
  invoice: {
    shippingItems: [{ invoiceItemIds: [91], rate: { name: 'Post', price: 25000 } }],
    invoiceItems: [{
      id: 91,
      productVariantId: 15,
      name: 'Red shoes',
      attributes: [],
      quantity: 2,
      unitPrice: 240000,
      lineTotal: 480000,
      rawPrice: 250000,
      customerProfit: 20000
    }]
  }
};

const rawAccountOrder = {
  id: 123,
  order_number: '10001',
  order_identifier: 'order-token',
  invoice: {
    invoice_items: [{
      id: 91,
      product_variant_id: 15,
      name: 'Red shoes',
      product_attributes: [],
      no_of_items: 2,
      single_item_price: 240000,
      total_items_price: 480000,
      raw_price: 250000,
      customer_profit: 20000
    }],
    shipping_items: []
  }
};

describe('account orders remain independent of payment completion', () => {
  it('accepts existing account fixtures and InvoiceItem[] consumers without totals', () => {
    const items: InvoiceItem[] = accountOrder.invoice.invoiceItems;
    const id: number = accountOrder.id;
    const orderNumber: string = accountOrder.orderNumber;
    expect(items[0].id).toBe(91);
    expect(id).toBe(123);
    expect(orderNumber).toBe('10001');

    // Payment verification can omit totals, but the account and checkout order
    // contracts must still remain distinct.
    const incompleteCheckout: CheckoutInvoice = { invoiceItems: [], shippingItems: [] };
    // @ts-expect-error Account Order cannot be used as a payment CheckoutOrder.
    const mixedOrder: CheckoutOrder = accountOrder;
    expect(incompleteCheckout).not.toHaveProperty('finalTotal');
    expect(mixedOrder).toBe(accountOrder);
  });

  it.each(['get', 'list'] as const)('preserves the account %s response transformer', async (method) => {
    const client = createSazitoClient({
      domain: 'shop.example.com',
      customFetchApi: async () => new Response(JSON.stringify({
        result: method === 'get' ? { order: rawAccountOrder } : {
          orders: [rawAccountOrder], page_number: 2, page_size: 10,
          total_count: 21, total_count_raw: 21, total_not_seen: 1, total_seen: 20
        }
      }), { headers: { 'Content-Type': 'application/json' } })
    });

    let order: Order | undefined;
    if (method === 'get') {
      order = (await client.orders.get(123)).data;
    } else {
      const response = await client.orders.list({ pageNumber: 2, pageSize: 10 });
      expect(response.data).toMatchObject({
        pageNumber: 2, pageSize: 10, totalCount: 21,
        totalCountRaw: 21, totalNotSeen: 1, totalSeen: 20
      });
      order = response.data?.orders[0];
    }

    expect(order).toMatchObject({ id: 123, orderNumber: '10001' });
    expect(order?.invoice.invoiceItems[0]).toMatchObject(accountOrder.invoice.invoiceItems[0]);
    expect(order?.invoice.invoiceItems[0]).not.toHaveProperty('singleItemPrice');
    expect(order?.invoice.invoiceItems[0]).not.toHaveProperty('productVariant');
  });
});
