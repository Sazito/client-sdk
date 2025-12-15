/**
 * Tests for HttpClient
 */

import { HttpClient } from '../http-client';
import { mergeConfig } from '../config';
import { mockFetch, mockFetchError, mockFetchWithRetries } from '../../test-helpers/mock-fetch';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    mockFetchFn = mockFetch({ result: { id: 1, name: 'Test' } });
    const config = mergeConfig({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn,
      debug: false
    });
    httpClient = new HttpClient(config);
  });

  describe('GET requests', () => {
    it('should make a GET request', async () => {
      const response = await httpClient.get('/api/products');

      expect(mockFetchFn).toHaveBeenCalledTimes(1);
      expect(mockFetchFn).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/products',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-forwarded-host': 'noel-accessories.ir'
          })
        })
      );
      expect(response.data).toBeDefined();
    });

    it('should build URL with query parameters', async () => {
      await httpClient.get('/api/products', { params: { page: 1, limit: 10 } });

      expect(mockFetchFn).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/products?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should transform response keys to camelCase', async () => {
      mockFetchFn = mockFetch({
        result: { product_name: 'Test', no_of_items: 5 }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(response.data).toHaveProperty('name', 'Test');
      expect(response.data).toHaveProperty('quantity', 5);
    });

    it('should cache successful GET responses', async () => {
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        cache: {
          products: { enabled: true, ttl: 60000 }
        }
      });
      httpClient = new HttpClient(config);

      await httpClient.get('/api/products');
      await httpClient.get('/api/products');

      // Should only call fetch once due to caching
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when cache option is false', async () => {
      await httpClient.get('/api/products', { cache: false });
      await httpClient.get('/api/products', { cache: false });

      expect(mockFetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST requests', () => {
    it('should make a POST request', async () => {
      await httpClient.post('/api/cart', { variantId: 123, quantity: 2 });

      expect(mockFetchFn).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/cart',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });

    it('should transform request body to snake_case', async () => {
      await httpClient.post('/api/cart', { variantId: 123, lineTotal: 1000 });

      const call = mockFetchFn.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body).toHaveProperty('variant_id', 123);
      expect(body).toHaveProperty('total_items_price', 1000);
    });

    it('should invalidate related cache on POST', async () => {
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        cache: { products: { enabled: true, ttl: 60000 } }
      });
      httpClient = new HttpClient(config);

      // Populate cache
      await httpClient.get('/api/products');
      expect(mockFetchFn).toHaveBeenCalledTimes(1);

      // POST should invalidate cache
      await httpClient.post('/api/products', { name: 'New Product' });

      // Next GET should hit the API again
      await httpClient.get('/api/products');
      expect(mockFetchFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('PUT requests', () => {
    it('should make a PUT request', async () => {
      await httpClient.put('/api/cart/123', { quantity: 5 });

      expect(mockFetchFn).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/cart/123',
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });

    it('should transform request body', async () => {
      await httpClient.put('/api/cart/123', { lineTotal: 2000 });

      const call = mockFetchFn.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body).toHaveProperty('total_items_price', 2000);
    });
  });

  describe('DELETE requests', () => {
    it('should make a DELETE request', async () => {
      await httpClient.delete('/api/cart/123');

      expect(mockFetchFn).toHaveBeenCalledWith(
        'http://api.sazito.com:8080/api/cart/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should invalidate cache on DELETE', async () => {
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        cache: { cart: { enabled: true, ttl: 60000 } }
      });
      httpClient = new HttpClient(config);

      await httpClient.get('/api/cart');
      await httpClient.delete('/api/cart/123');
      await httpClient.get('/api/cart');

      expect(mockFetchFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors gracefully', async () => {
      mockFetchFn = mockFetch({ message: 'Not found' }, { status: 404, ok: false });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products/999');

      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
      expect(response.error?.type).toBe('api');
      expect(response.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      mockFetchFn = mockFetchError(new Error('Network failure'));
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('network');
      expect(response.error?.message).toContain('Network failure');
    });

    it('should handle timeout errors', async () => {
      mockFetchFn = jest.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AbortError')), 100);
          })
      );
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        timeout: 50
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(response.error).toBeDefined();
      expect(response.error?.type).toBe('network');
    });
  });

  describe('Retry logic', () => {
    it('should retry on 5xx errors', async () => {
      mockFetchFn = mockFetchWithRetries(2, { result: { id: 1 } });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        retry: { enabled: true, retries: 3, retryDelay: 10 }
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(mockFetchFn).toHaveBeenCalledTimes(3); // 2 failures + 1 success
      expect(response.data).toBeDefined();
    });

    it('should not retry on 4xx errors', async () => {
      mockFetchFn = mockFetch({ message: 'Bad request' }, { status: 400, ok: false });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        retry: { enabled: true, retries: 3, retryDelay: 10 }
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(mockFetchFn).toHaveBeenCalledTimes(1); // No retries
      expect(response.error?.status).toBe(400);
    });

    it('should respect max retries', async () => {
      mockFetchFn = mockFetch({ error: 'Server error' }, { status: 500, ok: false });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        retry: { enabled: true, retries: 2, retryDelay: 10 }
      });
      httpClient = new HttpClient(config);

      const response = await httpClient.get('/api/products');

      expect(mockFetchFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(response.error).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should include JWT token in headers when available', async () => {
      // Mock token storage
      const tokenStorage = httpClient.getTokenStorage();
      jest.spyOn(tokenStorage, 'get').mockReturnValue('mock-jwt-token');

      await httpClient.get('/api/orders');

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'mock-jwt-token'
          })
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      const tokenStorage = httpClient.getTokenStorage();
      jest.spyOn(tokenStorage, 'get').mockReturnValue(null);

      await httpClient.get('/api/products');

      const headers = mockFetchFn.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('Cache management', () => {
    it('should clear all cache', () => {
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn,
        cache: { products: { enabled: true, ttl: 60000 } }
      });
      httpClient = new HttpClient(config);

      expect(() => httpClient.clearCache()).not.toThrow();
    });
  });

  describe('Custom headers', () => {
    it('should include custom headers in request', async () => {
      await httpClient.get('/api/products', {
        headers: { 'X-Custom-Header': 'test-value' }
      });

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value'
          })
        })
      );
    });

    it('should include domain in x-forwarded-host header', async () => {
      await httpClient.get('/api/products');

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-forwarded-host': 'noel-accessories.ir'
          })
        })
      );
    });
  });
});
