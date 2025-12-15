/**
 * Tests for Orders API
 */

import { OrdersAPI } from '../orders';
import { HttpClient } from '../../core/http-client';
import { mergeConfig } from '../../core/config';
import { mockFetch } from '../../test-helpers/mock-fetch';
import { mockOrder, mockPaginatedResponse } from '../../test-helpers/fixtures';

describe('OrdersAPI', () => {
  let ordersAPI: OrdersAPI;
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    mockFetchFn = mockFetch({ data: { result: {} } });
    const config = mergeConfig({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });
    const httpClient = new HttpClient(config);
    ordersAPI = new OrdersAPI(httpClient);
  });

  describe('list()', () => {
    it('should list orders without filters', async () => {
      mockFetchFn = mockFetch({
        data: {
          result: mockPaginatedResponse([mockOrder])
        }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      ordersAPI = new OrdersAPI(new HttpClient(config));

      const response = await ordersAPI.list();

      expect(response.data).toBeDefined();
      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.any(Object)
      );
    });

    it('should list orders with filters', async () => {
      await ordersAPI.list({ page: 1, pageSize: 10, status: 'processing' });

      const callUrl = mockFetchFn.mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('pageSize=10');
      expect(callUrl).toContain('status=processing');
    });
  });

  describe('get()', () => {
    it('should get single order by ID', async () => {
      mockFetchFn = mockFetch({
        data: {
          result: { order: mockOrder }
        }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      ordersAPI = new OrdersAPI(new HttpClient(config));

      const response = await ordersAPI.get('order-123');

      expect(response.data).toBeDefined();
      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/orders/order-123'),
        expect.any(Object)
      );
    });

    it('should handle 404 for non-existent order', async () => {
      mockFetchFn = mockFetch(
        { message: 'Not found' },
        { status: 404, ok: false }
      );
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      ordersAPI = new OrdersAPI(new HttpClient(config));

      const response = await ordersAPI.get('non-existent');

      expect(response.error).toBeDefined();
    });
  });
});
