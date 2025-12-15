/**
 * Tests for Products API
 */

import { ProductsAPI } from '../products';
import { HttpClient } from '../../core/http-client';
import { mergeConfig } from '../../core/config';
import { mockFetch } from '../../test-helpers/mock-fetch';
import { mockProduct, mockProductRaw, mockProducts, mockPaginatedResponse } from '../../test-helpers/fixtures';

describe('ProductsAPI', () => {
  let productsAPI: ProductsAPI;
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    mockFetchFn = mockFetch({ result: {} });
    const config = mergeConfig({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });
    const httpClient = new HttpClient(config);
    productsAPI = new ProductsAPI(httpClient);
  });

  describe('get()', () => {
    it('should fetch product by slug', async () => {
      mockFetchFn = mockFetch({
        result: {
          route: {
            entity_name: 'product',
            other_props: mockProductRaw
          }
        }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.get('test-product');

      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(mockProduct.id);
      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('entity_route'),
        expect.any(Object)
      );
    });

    it('should handle slug with /product/ prefix', async () => {
      mockFetchFn = mockFetch({
        result: {
          route: {
            entity_name: 'product',
            other_props: mockProductRaw
          }
        }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      await productsAPI.get('/product/test-product');

      const callUrl = mockFetchFn.mock.calls[0][0];
      expect(callUrl).toContain('url_part=%2Fproduct%2Ftest-product');
    });

    it('should handle 404 for non-existent product', async () => {
      mockFetchFn = mockFetch(
        { message: 'Not found' },
        { status: 404, ok: false }
      );
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.get('non-existent');

      expect(response.error).toBeDefined();
      expect(response.data).toBeUndefined();
    });

    it('should handle invalid entity type', async () => {
      mockFetchFn = mockFetch({
        result: {
          route: {
            entity_name: 'category',
            other_props: {}
          }
        }
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.get('category-slug');

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('invalid entity type');
    });
  });

  describe('list()', () => {
    it('should list products without filters', async () => {
      mockFetchFn = mockFetch({
        result: mockPaginatedResponse(mockProducts)
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.list();

      expect(response.data).toBeDefined();
      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.any(Object)
      );
    });

    it('should list products with filters', async () => {
      mockFetchFn = mockFetch({
        result: mockPaginatedResponse(mockProducts)
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      await productsAPI.list({
        page: 2,
        pageSize: 20,
        categoryId: 1
      });

      const callUrl = mockFetchFn.mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('pageSize=20');
      expect(callUrl).toContain('categoryId=1');
    });

    it('should handle empty product list', async () => {
      mockFetchFn = mockFetch({
        result: mockPaginatedResponse([], 1, 20, 0)
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.list();

      expect(response.data).toBeDefined();
      expect(response.data?.items).toEqual([]);
      expect(response.data?.total).toBe(0);
    });
  });

  describe('search()', () => {
    it('should search products by query', async () => {
      mockFetchFn = mockFetch({
        result: mockPaginatedResponse(mockProducts)
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.search('test query');

      expect(response.data).toBeDefined();
      const callUrl = mockFetchFn.mock.calls[0][0];
      expect(callUrl).toContain('q=test+query');
    });

    it('should handle empty search results', async () => {
      mockFetchFn = mockFetch({
        result: mockPaginatedResponse([], 1, 20, 0)
      });
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      productsAPI = new ProductsAPI(new HttpClient(config));

      const response = await productsAPI.search('nonexistent');

      expect(response.data).toBeDefined();
      expect(response.data?.items).toEqual([]);
    });
  });
});
