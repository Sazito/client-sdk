import assert from 'node:assert/strict';
import test from 'node:test';
import { createSazitoClient } from '../dist/index.mjs';

const json = data => new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json' }
});

const productStatistics = {
  average_rate: 4.5,
  total_count: 2,
  recommendations: {
    recommended_percentage: 50,
    recommended_total_count: 1
  }
};

test('getProductReviews maps the product comments envelope and pagination', async () => {
  const comments = [
    {
      product_rate: 5,
      user_first_name: 'Sara',
      user_last_name: 'M',
      created_at: '2026-09-18T10:00:00Z',
      owner: true,
      text: 'Excellent',
      recommendation_status: 'RECOMMENDED',
      pros: ['Fast'],
      cons: [],
      is_anonymous: false,
      metadata: {
        variant_options: [],
        product_name: 'Shoes',
        variant_id: 11
      },
      attachments: []
    },
    {
      product_rate: 4,
      user_first_name: 'Ali',
      user_last_name: 'R',
      created_at: '2026-09-17T10:00:00Z',
      owner: false,
      text: 'Good',
      recommendation_status: 'NEUTRAL',
      pros: [],
      cons: ['Packaging'],
      is_anonymous: false,
      metadata: {
        variant_options: [],
        product_name: 'Shoes',
        variant_id: 12
      },
      attachments: []
    }
  ];
  const fetchApi = async () => json({ result: {
    product_comments: { total: 2, results: comments },
    product_statistics: productStatistics,
    page_number: 3,
    page_size: 2
  } });
  const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi: fetchApi });

  const response = await client.feedbacks.getProductReviews(42, { pageNumber: 3, pageSize: 2 });

  assert.equal(response.error, undefined);
  assert.equal(response.data.entities.length, 2);
  assert.deepEqual(response.data.entities.map(comment => comment.text), ['Excellent', 'Good']);
  assert.deepEqual(response.data.entities[0].metadata, {
    variantOptions: [],
    productName: 'Shoes',
    variantId: '11'
  });
  assert.deepEqual(response.data, {
    ...response.data,
    pageNumber: 3,
    pageSize: 2,
    totalCount: 2,
    averageRate: 4.5,
    recommendations: {
      recommendedPercentage: 50,
      recommendedTotalCount: 1
    }
  });
});

test('getProductStatistics normalizes total_count to totalCount', async () => {
  const client = createSazitoClient({
    domain: 'shop.example.com',
    customFetchApi: async () => json({ result: { product_statistics: productStatistics } })
  });

  const response = await client.feedbacks.getProductStatistics(42);

  assert.deepEqual(response, { data: { productStatistics: {
    averageRate: 4.5,
    totalCount: 2,
    recommendations: {
      recommendedPercentage: 50,
      recommendedTotalCount: 1
    }
  } } });
});
