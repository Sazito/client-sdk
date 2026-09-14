import { describe, expect, it, vi } from 'vitest';
import { createSazitoClient } from '../../../src/index';
import type { CreateOrderRatingInput, ProductReviewRequest } from '../../../src/index';

const item = {
  product_id: 456, product_variant_id: 789, product_name: 'Shoes',
  product_attributes: [{ name: 'Color', value: 'Red' }],
  product_image: { url: '/shoes.jpg', alt: 'Shoes' },
  fulfillment_details: { invoice_identifier: 'invoice-token', payment_identifier: 'payment-token' }
};
const seed = { order_id: 123, order_identifier: 'order-token', has_comment_already: false, items: [item] };
const rating: CreateOrderRatingInput = { orderId: 123, orderIdentifier: 'order-token', orderRate: 5 };
const review: ProductReviewRequest = { commentId: 'comment-token', productId: 456, productVariantId: 789, productRate: 4 };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' }
});

describe('feedback seed', () => {
  it('encodes the identifier and retains extra seed fields without lossy key transformations', async () => {
    const identifier = 'token+/&?=#';
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json({
      result: { seed: { ...seed, order_identifier: identifier } }
    }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const response = await client.feedbacks.getSeed(` ${identifier} `);
    expect(new URL(String(fetchApi.mock.calls[0][0])).pathname).toBe(`/api/v1/feedbacks/seed/${encodeURIComponent(identifier)}`);
    expect(response.data).toMatchObject({ orderId: '123', orderIdentifier: identifier, hasCommentAlready: false });
    expect(response.data?.items[0]).toEqual({
      productId: '456', productVariantId: '789', productName: 'Shoes',
      productAttributes: item.product_attributes, productImage: item.product_image,
      fulfillment_details: item.fulfillment_details
    });
  });

  it.each(['', '  ', undefined, null, 123])('rejects missing or invalid identifier %j before fetching', async (identifier) => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.getSeed(identifier as string)).error?.type).toBe('validation');
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it.each([
    null, {}, { ...seed, order_id: '' }, { ...seed, order_identifier: 'another-order' },
    { ...seed, has_comment_already: 'false' }, { ...seed, items: null },
    { ...seed, items: [{ ...item, product_variant_id: '' }] }
  ])('rejects malformed or mismatched seed %j', async (data) => {
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: async () => json({ result: data }) });
    expect((await client.feedbacks.getSeed('order-token')).error?.type).toBe('api');
  });

  it.each([true, false])('preserves already-submitted=%s and empty items without creating a rating', async (hasCommentAlready) => {
    const fetchApi = vi.fn(async () => json({ data: {
      orderId: '123', orderIdentifier: 'order-token', hasCommentAlready, items: []
    } }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.getSeed('order-token')).data).toEqual({
      orderId: '123', orderIdentifier: 'order-token', hasCommentAlready, items: []
    });
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });
});

describe('creating order feedback', () => {
  it.each([123, '123'])('sends order ID %s, identifier, and rating to comments, retaining request options', async (orderId) => {
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json({ result: { id: 55 } }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const controller = new AbortController();
    expect(await client.feedbacks.createOrderRating({ ...rating, orderId }, {
      signal: controller.signal, headers: { 'X-Request-ID': 'feedback' }
    })).toEqual({ data: { id: '55' } });
    const [url, init] = fetchApi.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe('/api/v1/feedbacks/comments');
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBe(controller.signal);
    expect(new Headers(init?.headers).get('X-Request-ID')).toBe('feedback');
    expect(JSON.parse(String(init?.body))).toEqual({ order_id: Number(orderId), order_identifier: 'order-token', order_rate: 5 });
  });

  it.each([
    undefined, { ...rating, orderId: undefined }, { ...rating, orderId: '' }, { ...rating, orderId: -1 },
    { ...rating, orderId: 'not-a-number' }, { ...rating, orderId: '1.5' },
    { ...rating, orderIdentifier: undefined }, { ...rating, orderIdentifier: '  ' },
    ...[0, 6, 2.5, NaN, '5'].map(orderRate => ({ ...rating, orderRate }))
  ])('rejects invalid order credentials or rating before posting', async (input) => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.createOrderRating(input as CreateOrderRatingInput)).error?.type).toBe('validation');
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it.each([{}, { id: '' }, { id: null }, { id: {} }, null])('does not advance with an invalid comment response %j', async (data) => {
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: async () => json({ result: data }) });
    expect((await client.feedbacks.createOrderRating(rating)).error?.type).toBe('api');
  });
});

describe('product review submission', () => {
  it('does not let seed extras override validated submission fields', async () => {
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json({ result: {} }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    await client.feedbacks.submitProductReview({
      ...review, product_rate: 99, comment_id: 'wrong-comment', product_id: 'wrong-product',
      product_variant_id: 'wrong-variant', attachments_serve_keys: ['unfinished'], recommendation_status: 'YES'
    });
    expect(JSON.parse(String(fetchApi.mock.calls[0][1]?.body))).toMatchObject({
      product_rate: 4, comment_id: 'comment-token', product_id: 456, product_variant_id: 789,
      attachments_serve_keys: [], recommendation_status: 'NONE'
    });
  });

  it('submits seed fields and defaults for omitted optional fields', async () => {
    const fetchApi = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) =>
      String(url).includes('/seed/') ? json({ result: seed }) : json({ result: {} }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const loaded = await client.feedbacks.getSeed('order-token');
    const input = { ...loaded.data!.items[0], commentId: 'comment-token', productRate: 4 };
    expect((await client.feedbacks.submitProductReview(input)).error).toBeUndefined();
    const [url, init] = fetchApi.mock.calls[1];
    expect(new URL(String(url)).pathname).toBe('/api/v1/feedbacks/comments/details');
    expect(JSON.parse(String(init?.body))).toEqual({
      ...item, product_id: '456', product_variant_id: '789', comment_id: 'comment-token', product_rate: 4,
      text: '', pros: [], cons: [], recommendation_status: 'NONE', attachments_serve_keys: [], owner: true, is_anonymous: false
    });
    expect(input).not.toHaveProperty('recommendationStatus');
  });

  it.each(['RECOMMENDED', 'NEUTRAL', 'NOT-RECOMMENDED', 'NONE'] as const)('accepts %s with completed attachment keys', async (recommendationStatus) => {
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json({ result: {} }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    await client.feedbacks.submitProductReview({
      ...review, recommendationStatus, attachmentsServeKeys: ['uploaded-key'], text: 'Good quality',
      pros: ['Packaging'], cons: [], isAnonymous: true, owner: true
    });
    expect(JSON.parse(String(fetchApi.mock.calls[0][1]?.body))).toMatchObject({
      recommendation_status: recommendationStatus, attachments_serve_keys: ['uploaded-key'],
      text: 'Good quality', pros: ['Packaging'], cons: [], is_anonymous: true, owner: true
    });
  });

  it.each([
    { ...review, commentId: '' }, { ...review, productId: null }, { ...review, productVariantId: undefined },
    ...[0, 6, 1.5].map(productRate => ({ ...review, productRate })),
    { ...review, recommendationStatus: 'YES' }, { ...review, attachmentsServeKeys: [''] },
    { ...review, attachmentsServeKeys: [{ status: 'pending' }] }, { ...review, pros: 'good' },
    { ...review, text: 12 }, { ...review, isAnonymous: 'false' }
  ])('rejects invalid review data before posting', async (input) => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.submitProductReview(input as ProductReviewRequest)).error?.type).toBe('validation');
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it.each(['rating', 'product'] as const)('does not retry a failed %s POST even when retries are configured', async (method) => {
    const fetchApi = vi.fn(async () => json({ message: 'Try again' }, 503));
    const client = createSazitoClient({
      domain: 'shop.example.com', customFetchApi: fetchApi, retry: { enabled: true, retries: 3, retryDelay: 1 }
    });
    const response = method === 'rating'
      ? await client.feedbacks.createOrderRating(rating, { retries: 3 })
      : await client.feedbacks.submitProductReview(review, { retries: 3 });
    expect(response.error).toMatchObject({ type: 'api', status: 503 });
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });
});
