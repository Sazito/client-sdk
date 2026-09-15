import { describe, expect, it } from 'vitest';
import {
  transformCartResponse,
  transformCheckoutOrderResponse,
  transformInvoiceResponse
} from '../../../src/utils/transformers';

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
  it('falls back to product_variant.product_attributes when variant_attributes is empty', () => {
    const result = orderWithItem({
      variant_attributes: [],
      product_variant: {
        id: 20,
        product_attributes: [{ name: 'رنگ', value: { value: 'مشکی', extra: '#111111', fieldType: 'color' } }],
        product: { product_type: 'physical' }
      }
    });

    expect(result.invoice.invoiceItems[0].variantAttributes).toEqual([
      { name: 'رنگ', value: { value: 'مشکی', extra: '#111111', fieldType: 'color' } }
    ]);
  });

  it('keeps supporting normalized product_variant.attributes', () => {
    const result = orderWithItem({
      product_variant: {
        id: 20,
        attributes: [{ name: 'رنگ', value: 'مشکی' }],
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

describe('cart and invoice attribute normalization', () => {
  type Attribute = {
    name: string;
    value: string | { value: string; extra?: string; fieldType?: string };
  };
  const selected: Attribute[] = [{ name: 'رنگ', value: 'مشکی' }];

  function rawItem(overrides: {
    variantAttributes: Attribute[] | null;
    productAttributes: Attribute[] | null;
  }) {
    return {
      id: 10,
      name: 'Bag',
      no_of_items: 1,
      single_item_price: 100,
      total_items_price: 100,
      variant_attributes: overrides.variantAttributes,
      product_variant: {
        id: 20,
        product_attributes: overrides.productAttributes,
        product: { id: 30, name: 'Bag', product_type: 'physical' }
      }
    };
  }

  function normalize(item: ReturnType<typeof rawItem>) {
    const cart = transformCartResponse<{
      items: Array<{ product: { attributes: Attribute[] } }>;
    }>({
      data: { result: { cart: { id: 1, identifier: 'cart-token', items: [item] } } }
    });
    const invoice = transformInvoiceResponse<{
      items: Array<{ attributes: Attribute[] }>;
    }>({
      data: { result: { invoice: { id: 1, identifier: 'invoice-token', items: [item] } } }
    });

    return { cart: cart.items[0].product.attributes, invoice: invoice.items[0].attributes };
  }

  it('falls back to product_variant.product_attributes when variant_attributes is empty', () => {
    const result = normalize(rawItem({ variantAttributes: [], productAttributes: selected }));

    expect(result.cart).toEqual(selected);
    expect(result.invoice).toEqual(selected);
  });

  it('keeps variant_attributes when product_variant.product_attributes is empty', () => {
    const result = normalize(rawItem({ variantAttributes: selected, productAttributes: [] }));

    expect(result.cart).toEqual(selected);
    expect(result.invoice).toEqual(selected);
  });

  it('prefers variant_attributes when both sources are populated', () => {
    const productLevel: Attribute[] = [{ name: 'سایز', value: 'L' }];
    const result = normalize(rawItem({ variantAttributes: selected, productAttributes: productLevel }));

    expect(result.cart).toEqual(selected);
    expect(result.invoice).toEqual(selected);
  });

  it('keeps rich attribute values intact so the UI can render swatches', () => {
    const rich: Attribute[] = [
      { name: 'رنگ', value: { value: 'مشکی', extra: '#111111', fieldType: 'color' } }
    ];
    const result = normalize(rawItem({ variantAttributes: [], productAttributes: rich }));

    expect(result.cart).toEqual(rich);
    expect(result.invoice).toEqual(rich);
  });

  it('returns an empty list when neither source has values', () => {
    const result = normalize(rawItem({ variantAttributes: null, productAttributes: null }));

    expect(result.cart).toEqual([]);
    expect(result.invoice).toEqual([]);
  });
});
