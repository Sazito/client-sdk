import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSazitoClient,
  transformCartResponse,
  transformInvoiceResponse
} from '../dist/index.mjs';

const rawProduct = {
  id: 56,
  name: 'Phone',
  url: '/product/phone',
  product_attributes: [
    { attribute_type: 'differentiator', name: 'گارانتی', type: 'string', value: null },
    { attribute_type: 'differentiator', name: 'رنگ', type: 'string', value: ' نقره ای ' },
    { name: 'Empty', value: '' },
    { name: 'Swatch', value: { value: ' آبی ', extra: '#123456', field_type: 'color' } }
  ],
  product_variants: [{
    id: 7,
    product_attributes: [
      { name: 'Missing', value: null },
      { name: 'Size', value: ' XL ' },
      { name: 'Color', value: { value: ' مشکی ', extra: '#111111', field_type: 'color' } }
    ]
  }]
};

function assertAttributes(product) {
  assert.deepEqual(product.attributes, [
    { attributeType: 'differentiator', name: 'رنگ', type: 'string', value: 'نقره ای' },
    { name: 'Empty', value: '' },
    { name: 'Swatch', value: { value: 'آبی', extra: '#123456', fieldType: 'color' } }
  ]);
  assert.deepEqual(product.variants[0].attributes, [
    { name: 'Size', value: 'XL' },
    { name: 'Color', value: { value: 'مشکی', extra: '#111111', fieldType: 'color' } }
  ]);
}

test('get and list products omit null attributes and trim display values', async () => {
  const client = createSazitoClient({
    domain: 'shop.example.com',
    customFetchApi: async (input) => {
      const result = String(input).includes('/entity_route/')
        ? { route: { entity_name: 'product', entity_id: 56, other_props: rawProduct } }
        : { products: [rawProduct], total_count: 1 };
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  const detail = await client.products.get('phone');
  assert.equal(detail.error, undefined);
  assertAttributes(detail.data);

  const list = await client.products.list();
  assert.equal(list.error, undefined);
  assertAttributes(list.data.items[0]);
});

test('cart and invoice snapshots honor the same required attribute value contract', () => {
  const item = {
    id: 1,
    product_variant: { id: 7 },
    variant_attributes: [
      { name: 'Missing', value: null },
      { name: 'Color', value: { value: ' آبی ', extra: '#123456', field_type: 'color' } }
    ]
  };
  const cart = transformCartResponse({ data: { result: { cart: { items: [item] } } } });
  const invoice = transformInvoiceResponse({ data: { result: { invoice: { items: [item] } } } });
  const expected = [{ name: 'Color', value: { value: 'آبی', extra: '#123456', fieldType: 'color' } }];

  assert.deepEqual(cart.items[0].product.attributes, expected);
  assert.deepEqual(invoice.items[0].attributes, expected);
});
