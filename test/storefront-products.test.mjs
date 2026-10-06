import assert from 'node:assert/strict';
import test from 'node:test';
import { createSazitoClient } from '../dist/index.mjs';

const image = { id: 11, alt: 'Phone', url: 'https://cdn.example.com/phone.jpg', width: 800, height: 600 };
const variant = {
  id: 7, enabled: true, price: 90, raw_price: 100,
  stock_number: 3, is_stock_managed: true, image_id: 11,
  dynamic_form_id: 0, min_order_count: 1, has_max_order: true,
  max_no_of_order: 2, sort_index: 0, product_attributes: []
};
const listProduct = {
  id: 56, name: 'Phone', url: '/product/phone', enabled: true,
  product_type: 'physical', dynamic_form_id: 0, event_entity_id: 0,
  image_count: 5, images: [image], product_attributes: [],
  product_variants: [variant]
};
const detailProduct = {
  ...listProduct,
  product_categories: [{ id: 10, name: 'Phones', url: '/category/phones' }],
  product_attributes: [{ name: 'description', value: 'Phone description' }],
  product_variants: [{ ...variant, title: 'Silver phone', sku: 'PHONE-SILVER' }]
};
delete detailProduct.image_count;

function fixtureClient(result, status = 200) {
  const requests = [];
  const client = createSazitoClient({
    domain: 'shop.example.com', retry: { enabled: false, retries: 0, retryDelay: 0 },
    customFetchApi: async (input) => {
      requests.push(new URL(String(input)));
      return new Response(JSON.stringify({ result }), {
        status, headers: { 'Content-Type': 'application/json' }
      });
    }
  });
  return { client, requests };
}

test('list uses storefront filters and keeps the existing response wrapper', async () => {
  const { client, requests } = fixtureClient({
    products: [listProduct], total_count: 120, total_count_raw: 125,
    page_number: 2, page_size: 20, min_price: 10, max_price: 100,
    sub_categories: [{ id: 10, name: 'Phones', url: '/category/phones' }], stock_alert_limit: 3
  });
  const result = await client.products.list({
    page: 2, pageSize: 20, categories: [10, 20], sort: '!price',
    priceMin: 10, priceMax: 100, discountedOnly: true, pinnedIds: [56], similarTo: 57
  });
  assert.equal(result.error, undefined);
  const url = requests[0];
  assert.equal(url.pathname, '/api/v1/storefront/products');
  assert.equal(url.searchParams.get('page_size'), '20');
  assert.equal(url.searchParams.get('page_number'), '2');
  assert.equal(url.searchParams.get('sort'), 'price');
  assert.equal(url.searchParams.get('sort_order'), 'asc');
  assert.equal(url.searchParams.get('min_price'), '10');
  assert.equal(url.searchParams.get('max_price'), '100');
  assert.deepEqual(JSON.parse(url.searchParams.get('filters[]')), [
    { name: 'product_categories', value: '10,20' },
    { name: 'has_raw_price', value: true },
    { name: 'similar_to', value: { entity_name: 'product', entity_id: 57 } }
  ]);
  assert.equal(url.searchParams.get('pinned_ids'), '[56]');
  const { data } = result;
  assert.equal(data.total, 120);
  assert.equal(data.page, 2);
  assert.equal(data.pageSize, 20);
  assert.equal(data.totalPages, 6);
  assert.deepEqual(Object.keys(data).sort(), ['items', 'page', 'pageSize', 'total', 'totalPages']);
  const product = data.items[0];
  assert.equal(product.imageCount, 5);
  assert.deepEqual(product.images, [image]);
  assert.equal(product.variants[0].originalPrice, 100);
  assert.equal(product.variants[0].stockQuantity, 3);
  for (const field of ['categories', 'themeConfig', 'createdAt', 'updatedAt']) {
    assert.equal(Object.hasOwn(product, field), false);
  }
});

test('get sends a slug to storefront details without merging envelope metadata', async () => {
  const metafields = [{ name: 'Material', value: 'Metal' }];
  const { client, requests } = fixtureClient({ product: detailProduct, metafields, success_taxonomy: false });
  for (const input of ['phone', '/product/phone', '/product/%D9%81%D9%88%D9%86?ref=card#photos']) {
    const { data, error } = await client.products.get(input, { cache: false });
    assert.equal(error, undefined);
    assert.equal(data.id, 56);
    assert.equal(Object.hasOwn(data, 'metafields'), false);
    assert.equal(Object.hasOwn(data, 'successTaxonomy'), false);
    assert.equal(Object.hasOwn(data.variants[0], 'title'), false);
    assert.equal(data.variants[0].sku, 'PHONE-SILVER');
    assert.deepEqual(data.attributes, [{ name: 'description', value: 'Phone description' }]);
    assert.deepEqual(data.categories, [{ id: 10, name: 'Phones', url: '/category/phones' }]);
    assert.equal(Object.hasOwn(data, 'themeConfig'), false);
  }
  assert.deepEqual(requests.map((url) => url.pathname), Array(3).fill('/api/v1/storefront/products/details'));
  assert.deepEqual(requests.map((url) => url.searchParams.get('url_part')), ['phone', 'phone', 'فون']);
});

test('get handles a single-key detail envelope and preserves null versus empty collections', async () => {
  for (const collection of [null, []]) {
    const { client } = fixtureClient({ product: {
      ...detailProduct, images: collection, product_categories: collection, product_variants: collection
    } });
    const { data, error } = await client.products.get('phone');
    assert.equal(error, undefined);
    assert.deepEqual(data.images, collection);
    assert.deepEqual(data.categories, collection);
    assert.deepEqual(data.variants, collection);
  }
});

test('missing details and API errors return errors without endpoint fallback', async () => {
  for (const [body, status, expectedStatus] of [
    [{ product: null }, 200, 404], [{}, 200, 404],
    [{ message: 'Missing product' }, 404, 404], [{ message: 'Unavailable' }, 500, 500]
  ]) {
    const { client, requests } = fixtureClient(body, status);
    const result = await client.products.get('phone');
    assert.equal(result.error.type, 'api');
    assert.equal(result.error.status, expectedStatus);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].pathname, '/api/v1/storefront/products/details');
  }
});

test('both search methods use storefront search and keep all result groups and weaker SDP values', async () => {
  const { client, requests } = fixtureClient({
    products: [{ ...listProduct, product_type: '', images: [{ ...image, id: 0, width: 0, height: 0 }] }],
    products_count: 1, products_page_number: 2, products_page_size: 8,
    product_categories: [{ id: 10, name: 'Phones', url: '/category/phones', description: 'Phones category' }],
    product_categories_count: 1,
    cms_pages: [{ id: 20, name: 'About', url: '/page/about', content: 'About us' }], cms_pages_count: 1,
    blog_pages: [{ id: 30, name: 'News', url: '/blog/news', content: 'News content' }], blog_pages_count: 1
  });
  for (const call of [
    () => client.products.search('phone', { page: 2, pageSize: 8 }),
    () => client.search.query('phone', { page: 2, pageSize: 8, categoryId: 10, minPrice: 10, maxPrice: 100 })
  ]) {
    const { data, error } = await call();
    assert.equal(error, undefined);
    assert.equal(data.products.items[0].imageCount, 5);
    assert.equal(data.products.items[0].productType, '');
    assert.deepEqual(data.products.items[0].images, [{ ...image, id: 0, width: 0, height: 0 }]);
    assert.equal(data.products.total, 1);
    assert.equal(data.products.page, 2);
    assert.equal(data.products.pageSize, 8);
    assert.equal(data.productCategories.items[0].description, 'Phones category');
    assert.equal(data.cmsPages.items[0].content, 'About us');
    assert.equal(data.blogPages.items[0].content, 'News content');
    assert.equal(data.productCategories.total, 1);
    assert.equal(data.cmsPages.total, 1);
    assert.equal(data.blogPages.total, 1);
  }
  for (const url of requests) {
    assert.equal(url.pathname, '/api/v1/storefront/search');
    assert.equal(url.searchParams.get('query'), 'phone');
    assert.equal(url.searchParams.get('page_number'), '2');
    assert.equal(url.searchParams.get('page_size'), '8');
    assert.equal(url.searchParams.get('search_direction'), 'center');
  }
  assert.equal(requests[1].searchParams.get('category_id'), '10');
  assert.equal(requests[1].searchParams.get('min_price'), '10');
  assert.equal(requests[1].searchParams.get('max_price'), '100');
});

test('entity routes use storefront routing and preserve the detail variant contract', async () => {
  const { client, requests } = fixtureClient({ route: {
    entity_name: 'product', entity_id: 56, other_props: detailProduct
  } });
  const { data, error } = await client.entityRoutes.resolve('/product/phone');
  assert.equal(error, undefined);
  assert.equal(requests[0].pathname, '/api/v1/storefront/entity_route/route');
  assert.equal(requests[0].searchParams.get('url_part'), '/product/phone');
  assert.equal(data.entityId, 56);
  assert.equal(data.entity.id, undefined);
  assert.equal(Object.hasOwn(data.entity.variants[0], 'title'), false);
  assert.equal(data.entity.variants[0].sku, 'PHONE-SILVER');
});
