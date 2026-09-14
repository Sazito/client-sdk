import { describe, expect, it, vi } from 'vitest';
import { createSazitoClient } from '../../../src/index';
import { buildProductReviewInput } from '../../../src/index';
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
  it('builds a review from a seed item while retaining backend fields', () => {
    expect(buildProductReviewInput({
      productId: '456', productVariantId: '789', productName: 'Shoes',
      productAttributes: item.product_attributes, productImage: item.product_image,
      fulfillment_details: item.fulfillment_details
    }, 'comment-token', { productRate: 5, text: ' Great ', pros: ['Quality'] })).toEqual({
      productId: '456', productVariantId: '789', productName: 'Shoes',
      productAttributes: item.product_attributes, productImage: item.product_image,
      fulfillment_details: item.fulfillment_details,
      commentId: 'comment-token', productRate: 5, text: ' Great ', pros: ['Quality'],
      cons: [], recommendationStatus: 'NONE', attachmentsServeKeys: [], owner: true,
      isAnonymous: false
    });
  });

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
      ...item, product_id: 456, product_variant_id: 789, comment_id: 'comment-token', product_rate: 4,
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
    { ...review, productId: 'not-a-number' }, { ...review, productVariantId: '1.5' },
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

  it.each(['456', 456])('normalizes product IDs from seed strings to JSON numbers (%s)', async (productId) => {
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json({ result: {} }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    await client.feedbacks.submitProductReview({ ...review, productId, productVariantId: '789' });
    expect(JSON.parse(String(fetchApi.mock.calls[0][1]?.body))).toMatchObject({
      product_id: 456, product_variant_id: 789
    });
  });

  it.each(['', 'abc', '1.5', 0])('rejects invalid product IDs before requesting review statistics or reviews (%j)', async (productId) => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.getProductStatistics(productId as string)).error?.type).toBe('validation');
    expect((await client.feedbacks.getProductReviews(productId as string)).error?.type).toBe('validation');
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

describe('complete feedback submission', () => {
  it('loads the seed, creates one rating, then submits product reviews sequentially', async () => {
    const calls: string[] = [];
    const fetchApi = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(String(url)).pathname;
      calls.push(`${init?.method}:${path}`);
      if (path.includes('/seed/')) return json({ result: { seed } });
      if (path.endsWith('/feedbacks/comments')) return json({ result: { id: 'comment-token' } });
      return json({ result: {} });
    });
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const response = await client.feedbacks.submitOrderFeedback({
      orderIdentifier: 'order-token', orderRate: 5,
      reviews: [{ item: (await client.feedbacks.getSeed('order-token')).data!.items[0], draft: { productRate: 4 } }]
    });
    expect(response.data).toMatchObject({ status: 'submitted', commentId: 'comment-token', submittedProductCount: 1 });
    expect(calls.slice(-3)).toEqual([
      'GET:/api/v1/feedbacks/seed/order-token',
      'POST:/api/v1/feedbacks/comments',
      'POST:/api/v1/feedbacks/comments/details'
    ]);
  });

  it('reuses a seed supplied by the host instead of fetching it again', async () => {
    const fetchApi = vi.fn(async (url: RequestInfo | URL) => {
      const path = new URL(String(url)).pathname;
      return path.endsWith('/feedbacks/comments') ? json({ result: { id: 'comment-token' } }) : json({ result: {} });
    });
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const response = await client.feedbacks.submitOrderFeedback({
      orderIdentifier: 'order-token', orderRate: 5, seed: {
        orderId: '123', orderIdentifier: 'order-token', hasCommentAlready: false,
        items: [{ ...item, productId: '456', productVariantId: '789', productName: 'Shoes', productAttributes: item.product_attributes, productImage: item.product_image }]
      },
      reviews: [{
        item: { ...item, productId: '456', productVariantId: '789', productName: 'Shoes', productAttributes: item.product_attributes, productImage: item.product_image },
        draft: { productRate: 4 }
      }]
    });
    expect(response.data?.submittedProductCount).toBe(1);
    expect(fetchApi.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/api/v1/feedbacks/comments', '/api/v1/feedbacks/comments/details'
    ]);
  });

  it('returns progress when a product submission fails and never creates another rating', async () => {
    let detailsCalls = 0;
    const fetchApi = vi.fn(async (url: RequestInfo | URL) => {
      const path = new URL(String(url)).pathname;
      if (path.includes('/seed/')) return json({ result: { seed: { ...seed, items: [item, { ...item, product_id: 457 }] } } });
      if (path.endsWith('/feedbacks/comments')) return json({ result: { id: 'comment-token' } });
      detailsCalls += 1;
      return detailsCalls === 1 ? json({ result: {} }) : json({ message: 'failed' }, 422);
    });
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const loaded = await client.feedbacks.getSeed('order-token');
    const response = await client.feedbacks.submitOrderFeedback({
      orderIdentifier: 'order-token', orderRate: 5,
      reviews: loaded.data!.items.map(item => ({ item, draft: { productRate: 4 } }))
    });
    expect(response.error).toMatchObject({ type: 'api', status: 422 });
    expect(response.error?.details).toMatchObject({ feedback: {
      commentId: 'comment-token', submittedProductCount: 1, requestedProductCount: 2
    } });
    expect(fetchApi.mock.calls.filter(([url]) => new URL(String(url)).pathname.endsWith('/feedbacks/comments')).length).toBe(1);
  });

  it('does not create a rating when the seed is already submitted', async () => {
    const fetchApi = vi.fn(async () => json({ result: { seed: { ...seed, has_comment_already: true } } }));
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const response = await client.feedbacks.submitOrderFeedback({ orderIdentifier: 'order-token', orderRate: 5 });
    expect(response.data).toMatchObject({ status: 'already_submitted', submittedProductCount: 0 });
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });
});

describe('feedback image uploads', () => {
  it.each([{ images: [] }, { images: [{ file: new Blob([]) }] }])('rejects $images before making an upload request', async ({ images }) => {
    const fetchApi = vi.fn();
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    expect((await client.feedbacks.uploadReviewImages(images as any)).error?.type).toBe('validation');
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it('sends non-empty multipart files and normalizes completed serve keys', async () => {
    const fetchApi = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body as FormData;
      expect(body.getAll('images[][file]')).toHaveLength(1);
      expect((body.getAll('images[][file]')[0] as File).name).toBe('review.webp');
      expect(body.getAll('images[][name]')).toEqual(['review.webp']);
      expect(body.getAll('images[][alt]')).toEqual(['']);
      expect(Object.keys(Object.fromEntries(new Headers(init?.headers).entries()))
        .some(key => key === 'content-type')).toBe(false);
      return json({ result: { images: [{ id: 1, serve_key: 'serve-1' }] } });
    });
    const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });
    const response = await client.feedbacks.uploadReviewImages([{
      file: new Blob(['image-bytes'], { type: 'image/webp' }), name: 'review.webp'
    }], { headers: { 'content-type': 'multipart/form-data' } });
    expect(response).toEqual({ data: { images: [{ id: '1', url: '', alt: '', serveUrl: '', serveKey: 'serve-1' }] } });
  });
});
