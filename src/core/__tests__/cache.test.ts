/**
 * Tests for CacheManager
 */

import { CacheManager } from '../cache';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe('set() and get()', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', { data: 'test' });
      const result = cache.get('key1');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'first');
      cache.set('key1', 'second');
      expect(cache.get('key1')).toBe('second');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should return value within TTL', () => {
      cache.set('key1', 'value');
      const result = cache.get('key1', 10000); // 10 seconds TTL
      expect(result).toBe('value');
    });

    it('should return null for expired values', () => {
      cache.set('key1', 'value');

      // Fast-forward time by mocking Date.now()
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 11000); // 11 seconds later

      const result = cache.get('key1', 10000); // 10 seconds TTL
      expect(result).toBeNull();

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should delete expired entries from cache', () => {
      cache.set('key1', 'value');

      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 11000);

      cache.get('key1', 10000);

      // Try to get again - should still be null
      expect(cache.get('key1')).toBeNull();

      Date.now = originalNow;
    });

    it('should not expire if no TTL is specified', () => {
      cache.set('key1', 'value');

      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 1000000); // Very far in the future

      const result = cache.get('key1'); // No TTL
      expect(result).toBe('value');

      Date.now = originalNow;
    });
  });

  describe('delete()', () => {
    it('should delete specific cache entry', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle deleting non-existent keys', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow();
    });
  });

  describe('deletePattern()', () => {
    it('should delete entries matching a pattern', () => {
      cache.set('products:123', { id: 123 });
      cache.set('products:456', { id: 456 });
      cache.set('cart:789', { id: 789 });

      cache.deletePattern('products:.*');

      expect(cache.get('products:123')).toBeNull();
      expect(cache.get('products:456')).toBeNull();
      expect(cache.get('cart:789')).toEqual({ id: 789 });
    });

    it('should handle complex patterns', () => {
      cache.set('GET:/api/products?page=1', { data: 1 });
      cache.set('GET:/api/products?page=2', { data: 2 });
      cache.set('POST:/api/cart', { data: 3 });

      cache.deletePattern('GET:.*products');

      expect(cache.get('GET:/api/products?page=1')).toBeNull();
      expect(cache.get('GET:/api/products?page=2')).toBeNull();
      expect(cache.get('POST:/api/cart')).toEqual({ data: 3 });
    });

    it('should not delete if pattern does not match', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.deletePattern('nomatch.*');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('clear()', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should work on empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe('generateKey()', () => {
    it('should generate cache key from method and URL', () => {
      const key = CacheManager.generateKey('GET', '/api/products');
      expect(key).toBe('GET:/api/products:');
    });

    it('should include params in cache key', () => {
      const key = CacheManager.generateKey('GET', '/api/products', { page: 1, limit: 10 });
      expect(key).toBe('GET:/api/products:{"page":1,"limit":10}');
    });

    it('should generate different keys for different params', () => {
      const key1 = CacheManager.generateKey('GET', '/api/products', { page: 1 });
      const key2 = CacheManager.generateKey('GET', '/api/products', { page: 2 });
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different methods', () => {
      const key1 = CacheManager.generateKey('GET', '/api/products');
      const key2 = CacheManager.generateKey('POST', '/api/products');
      expect(key1).not.toBe(key2);
    });

    it('should handle complex param objects', () => {
      const params = {
        filters: { category: 'electronics', price: { min: 100, max: 500 } },
        sort: 'price',
        page: 1
      };
      const key = CacheManager.generateKey('GET', '/api/products', params);
      expect(key).toContain('GET:/api/products:');
      expect(key).toContain('electronics');
    });
  });
});
