#!/usr/bin/env node

// Live release/deployment check. Unit tests deliberately use local TLS fixtures
// so their results do not depend on the public service's availability.
import assert from 'node:assert/strict';
import tls from 'node:tls';
import { createSazitoClient } from '../dist/index.mjs';

const config = {
  domain: process.env.SAZITO_DOMAIN || 'noel.sazito.com',
  apiKey: process.env.SAZITO_API_KEY || undefined,
  timeout: 10000,
  retry: { enabled: false, retries: 0, retryDelay: 0 }
};

try {
  assert.notEqual(process.env.NODE_TLS_REJECT_UNAUTHORIZED, '0', 'TLS verification must be enabled');

  // Obtain the fixed origin from the SDK rather than duplicating it here.
  let origin;
  const capture = createSazitoClient({
    ...config,
    customFetchApi: async input => {
      origin = new URL(String(input));
      return Response.json({ result: {} });
    }
  });
  await capture.general.getInfo();
  assert.equal(origin.origin, 'https://sdk.sazito.com');
  assert.equal(origin.protocol, 'https:', 'The production API origin must use HTTPS');

  const certificate = await new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: origin.hostname,
      port: Number(origin.port || 443),
      servername: origin.hostname,
      rejectUnauthorized: true
    }, () => {
      const peer = socket.getPeerCertificate();
      socket.end();
      resolve(peer);
    });
    socket.setTimeout(10000, () => socket.destroy(new Error('TLS handshake timed out')));
    socket.on('error', reject);
  });

  // Exercise the SDK's own transport with native fetch and normal verification.
  const result = await createSazitoClient(config).general.getInfo({ cache: false });
  if (result.error) {
    const cause = result.error.details?.cause;
    throw new Error(`SDK request failed: ${cause?.code || result.error.status || result.error.type}: ${cause?.message || result.error.message}`);
  }
  console.log(`Trusted HTTPS and native SDK request verified: ${origin.origin}`);
  console.log(`Certificate issuer: ${certificate.issuer.CN}; valid until ${certificate.valid_to}`);
} catch (error) {
  console.error(`HTTPS check failed: ${error.code ? `${error.code}: ` : ''}${error.message}`);
  process.exitCode = 1;
}
