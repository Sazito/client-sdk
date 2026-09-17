import assert from 'node:assert/strict';
import test from 'node:test';
import { createSazitoClient } from '../dist/index.mjs';

test('wallet pagination uses camelCase filters and transforms backend pagination', async () => {
  const requests = [];
  const client = createSazitoClient({
    domain: 'shop.example.com',
    customFetchApi: async (input) => {
      requests.push(new URL(String(input)));
      return new Response(JSON.stringify({
        result: {
          transactions: [],
          page_number: 2,
          page_size: 12,
          total_count: 0
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  const response = await client.wallet.listTransactions({ pageNumber: 2, pageSize: 12 });
  assert.deepEqual(response.data, {
    transactions: [],
    pageNumber: 2,
    pageSize: 12,
    totalCount: 0
  });
  assert.equal(requests[0].searchParams.get('page_number'), '2');
  assert.equal(requests[0].searchParams.get('page_size'), '12');

  await client.wallet.listTransactions();
  assert.equal(requests[1].searchParams.get('page_number'), '1');
  assert.equal(requests[1].searchParams.get('page_size'), '20');
});
