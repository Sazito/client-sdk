import { describe, expect, it } from 'vitest';
import { transformCheckoutOrderResponse } from '../../../src/utils/transformers';

function orderWithItem(item: Record<string, unknown>) {
  return transformCheckoutOrderResponse<{
    invoice: { invoiceItems: Array<{ variantAttributes: Array<{ name: string; value: string }> }> };
  }>({
    id: 1,
    order_number: 2,
    order_identifier: 'order-token',
    invoice: {
      invoice_items: [{
        id: 10,
        name: 'Bag',
        no_of_items: 1,
        single_item_price: 100,
        total_items_price: 100,
        product_variant: { id: 20, product: { product_type: 'physical' } },
        ...item
      }],
      shipping_items: []
    }
  });
}

describe('checkout order attribute normalization', () => {
  it('falls back to product_variant.attributes when variant_attributes is absent', () => {
    const result = orderWithItem({
      product_variant: {
        id: 20,
        attributes: [{ name: 'رنگ', value: { value: 'مشکی', extra: '#111111', fieldType: 'color' } }],
        product: { product_type: 'physical' }
      }
    });

    expect(result.invoice.invoiceItems[0].variantAttributes).toEqual([
      { name: 'رنگ', value: 'مشکی' }
    ]);
  });

  it('prefers the explicit invoice-line attributes when both locations exist', () => {
    const result = orderWithItem({
      variant_attributes: [{ name: 'رنگ', value: 'سفید' }],
      product_variant: {
        id: 20,
        attributes: [{ name: 'رنگ', value: 'مشکی' }],
        product: { product_type: 'physical' }
      }
    });

    expect(result.invoice.invoiceItems[0].variantAttributes).toEqual([
      { name: 'رنگ', value: 'سفید' }
    ]);
  });
});
