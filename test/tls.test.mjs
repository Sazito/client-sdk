import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { createSazitoClient } from '../dist/index.mjs';

const certificatePath = fileURLToPath(new URL('./fixtures/tls/localhost-cert.pem', import.meta.url));
const certificate = readFileSync(certificatePath);
const key = readFileSync(new URL('./fixtures/tls/localhost-key.pem', import.meta.url));
const runNode = promisify(execFile);

async function serve(t) {
  const requests = [];
  const server = https.createServer({ cert: certificate, key }, async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ url: request.url, method: request.method, headers: request.headers, body });
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ result: { balance: 123, enabled: true } }));
  });
  // A TLS handshake failure is expected in the rejection regression below.
  server.on('tlsClientError', () => {});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return { requests, origin: `https://127.0.0.1:${server.address().port}` };
}

test('native fetch rejects the exact self-signed certificate failure without a fallback or TLS bypass', async (t) => {
  assert.notEqual(process.env.NODE_TLS_REJECT_UNAUTHORIZED, '0');
  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  const { origin, requests } = await serve(t);
  const client = createSazitoClient({
    domain: 'shop.example.com', timeout: 5000,
    // Test-only routing to a local certificate fixture. Native fetch still
    // performs the handshake; the SDK itself always constructs its fixed URL.
    customFetchApi: (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, 'https://sdk.sazito.com');
      return fetch(`${origin}${url.pathname}${url.search}`, init);
    }
  });

  const result = await client.wallet.getBalance();
  assert.equal(result.data, undefined);
  assert.equal(result.error.type, 'network');
  assert.equal(result.error.message, 'fetch failed');
  assert.equal(result.error.details.name, 'TypeError');
  assert.equal(result.error.details.cause.code, 'DEPTH_ZERO_SELF_SIGNED_CERT');
  assert.match(result.error.details.cause.message, /self-signed certificate/);
  assert.deepEqual(JSON.parse(JSON.stringify(result.error.details)), result.error.details);
  assert.equal(requests.length, 0);
  assert.equal(process.env.NODE_TLS_REJECT_UNAUTHORIZED, previousTlsSetting);
});

test('native fetch accepts a trusted HTTPS origin while preserving API keys, auth, and multipart uploads', async (t) => {
  const { origin, requests } = await serve(t);
  const entry = new URL('../dist/index.mjs', import.meta.url).href;
  // This trust root is restricted to a child test process. Verification remains
  // enabled; no consumer needs this certificate or a custom fetch implementation.
  const { stdout } = await runNode(process.execPath, ['--input-type=module', '-e', `
    import { createSazitoClient } from ${JSON.stringify(entry)};
    import assert from 'node:assert/strict';
    const client = createSazitoClient({
      domain: 'shop.example.com', apiKey: 'test-key',
      customFetchApi: (input, init) => {
        const url = new URL(String(input));
        assert.equal(url.origin, 'https://sdk.sazito.com');
        return fetch(${JSON.stringify(origin)} + url.pathname + url.search, init);
      }
    });
    const result = await client.wallet.getBalance({ headers: { Authorization: 'test-jwt' } });
    await client.images.upload(new Blob(['test-image'], { type: 'image/png' }), {
      headers: { Authorization: 'test-jwt' }
    });
    await client.images.delete(1, { headers: { Authorization: 'test-jwt' } });
    console.log(JSON.stringify(result));
  `], {
    env: { ...process.env, NODE_EXTRA_CA_CERTS: certificatePath },
    timeout: 10000
  });
  assert.deepEqual(JSON.parse(stdout), { data: { balance: 123, enabled: true } });
  assert.deepEqual(requests.map(request => request.method), ['GET', 'POST', 'DELETE']);
  for (const request of requests) {
    assert.equal(request.headers['sazito-api-key'], 'test-key');
    assert.equal(request.headers.authorization, 'test-jwt');
    assert.equal(request.headers['x-domain'], 'shop.example.com');
    assert.equal(request.headers['x-forwarded-host'], undefined);
  }
  assert.match(requests[1].headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.match(requests[1].body, /test-image/);
});

test('production SDK sources contain no certificate-verification bypass', () => {
  const sources = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : [];
  });
  for (const file of sources('src')) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /NODE_TLS_REJECT_UNAUTHORIZED|rejectUnauthorized\s*:\s*false|checkServerIdentity\s*:/, file);
  }
});
