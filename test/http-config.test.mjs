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

test('custom API origins and case-insensitive per-request API key overrides work', async () => {
  const { client, requests } = captureClient({
    apiBaseUrl: 'https://custom-api.example.com/',
    apiKey: 'default-key'
  });
  for (const headerName of ['Sazito-API-Key', 'sazito-api-key']) {
    await client.wallet.getBalance({ headers: { [headerName]: 'request-key' } });
  }
  for (const request of requests) {
    assert.equal(request.url.origin, 'https://custom-api.example.com');
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
