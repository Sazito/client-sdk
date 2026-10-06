import assert from 'node:assert/strict';
import test from 'node:test';
import { createSazitoClient, images } from '../dist/index.mjs';

function captureClient(config = {}) {
  const requests = [];
  const client = createSazitoClient({
    domain: 'shop.example.com',
    ...config,
    customFetchApi: async (input, init) => {
      requests.push({ url: new URL(String(input)), ...init });
      return Response.json({ result: {} });
    }
  });
  return { client, requests };
}

test('default transport uses the HTTPS SDK origin and configured API key', async () => {
  const { client, requests } = captureClient({ apiKey: 'test-api-key' });
  await client.wallet.getBalance();

  assert.equal(requests[0].url.origin, 'https://sdk.sazito.com');
  assert.equal(requests[0].url.port, '');
  const headers = new Headers(requests[0].headers);
  assert.equal(headers.get('Sazito-API-Key'), 'test-api-key');
  assert.equal(headers.get('x-forwarded-host'), 'shop.example.com');
  assert.equal(headers.get('Content-Type'), 'application/json');
});

test('API key header is omitted when the key is absent or empty', async () => {
  for (const config of [{}, { apiKey: '' }]) {
    const { client, requests } = captureClient(config);
    await client.wallet.getBalance();
    assert.equal(new Headers(requests[0].headers).has('Sazito-API-Key'), false);
  }
});

test('unsupported configuration cannot override the fixed HTTPS origin', async () => {
  for (const apiBaseUrl of [undefined, 'http://api.sazito.com:8080', 'https://other.example.com']) {
    const { client, requests } = captureClient({ apiBaseUrl });
    await client.wallet.getBalance();
    assert.equal(requests[0].url.origin, 'https://sdk.sazito.com');
  }
});

test('the fixed HTTPS origin applies to every HTTP verb and preserves retries', async () => {
  const requests = [];
  const client = createSazitoClient({
    domain: 'shop.example.com', apiKey: 'test-key',
    retry: { enabled: true, retries: 1, retryDelay: 0 },
    customFetchApi: async (input, init) => {
      requests.push({ url: new URL(String(input)), ...init });
      return Response.json({ result: {} }, { status: requests.length === 1 ? 503 : 200 });
    }
  });
  await client.wallet.getBalance({ headers: { Authorization: 'test-jwt' } });
  await client.images.upload(new Blob(['image']));
  await client.users.updateProfile(123, { firstName: 'Test' });
  await client.images.delete(1);
  assert.deepEqual(requests.map(request => request.method), ['GET', 'GET', 'POST', 'PUT', 'DELETE']);
  for (const request of requests) {
    assert.equal(request.url.origin, 'https://sdk.sazito.com');
    assert.ok(request.url.pathname.startsWith('/api/'));
    assert.equal(new Headers(request.headers).get('Sazito-API-Key'), 'test-key');
  }
  assert.equal(new Headers(requests[1].headers).get('Authorization'), 'test-jwt');
  assert.equal(requests[0].url.href, requests[1].url.href);
  assert.ok(requests[2].body instanceof FormData);
  assert.equal(new Headers(requests[2].headers).has('Content-Type'), false);
  assert.deepEqual(JSON.parse(requests[3].body), { first_name: 'Test' });
});

test('case-insensitive per-request API key overrides work on the fixed origin', async () => {
  const { client, requests } = captureClient({
    apiKey: 'default-key'
  });
  for (const headerName of ['Sazito-API-Key', 'sazito-api-key']) {
    await client.wallet.getBalance({ headers: { [headerName]: 'request-key' } });
  }
  for (const request of requests) {
    assert.equal(request.url.origin, 'https://sdk.sazito.com');
    assert.ok(!request.url.pathname.startsWith('//'));
    assert.equal(new Headers(request.headers).get('Sazito-API-Key'), 'request-key');
  }
});

test('module factories send the API key on multipart uploads and DELETE requests', async () => {
  const requests = [];
  const imagesApi = images({
    domain: 'shop.example.com',
    apiKey: 'upload-key',
    customFetchApi: async (input, init) => {
      requests.push({ url: String(input), ...init });
      return Response.json({ result: {} });
    }
  });
  await imagesApi.upload(new Blob(['image'], { type: 'image/png' }));
  await imagesApi.delete(1);

  assert.deepEqual(requests.map(request => request.method), ['POST', 'DELETE']);
  for (const request of requests) {
    assert.equal(new Headers(request.headers).get('Sazito-API-Key'), 'upload-key');
  }
  assert.ok(requests[0].body instanceof FormData);
  assert.equal(new Headers(requests[0].headers).has('Content-Type'), false);
});
