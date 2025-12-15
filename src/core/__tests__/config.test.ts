/**
 * Tests for Configuration
 */

import { mergeConfig, DEFAULT_CONFIG, SazitoConfig } from '../config';

describe('Configuration', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.timeout).toBe(30000);
      expect(DEFAULT_CONFIG.retry.enabled).toBe(true);
      expect(DEFAULT_CONFIG.retry.retries).toBe(3);
      expect(DEFAULT_CONFIG.retry.retryDelay).toBe(1000);
      expect(DEFAULT_CONFIG.debug).toBe(false);
    });

    it('should have cache config for all API types', () => {
      expect(DEFAULT_CONFIG.cache.products).toBeDefined();
      expect(DEFAULT_CONFIG.cache.categories).toBeDefined();
      expect(DEFAULT_CONFIG.cache.cart).toBeDefined();
      expect(DEFAULT_CONFIG.cache.orders).toBeDefined();
      expect(DEFAULT_CONFIG.cache.search).toBeDefined();
      expect(DEFAULT_CONFIG.cache.cms).toBeDefined();
      expect(DEFAULT_CONFIG.cache.tags).toBeDefined();
      expect(DEFAULT_CONFIG.cache.entityRoutes).toBeDefined();
    });

    it('should disable cache for cart and orders', () => {
      expect(DEFAULT_CONFIG.cache.cart.enabled).toBe(false);
      expect(DEFAULT_CONFIG.cache.orders.enabled).toBe(false);
    });

    it('should enable cache for products, categories, search, cms, tags', () => {
      expect(DEFAULT_CONFIG.cache.products.enabled).toBe(true);
      expect(DEFAULT_CONFIG.cache.categories.enabled).toBe(true);
      expect(DEFAULT_CONFIG.cache.search.enabled).toBe(true);
      expect(DEFAULT_CONFIG.cache.cms.enabled).toBe(true);
      expect(DEFAULT_CONFIG.cache.tags.enabled).toBe(true);
    });
  });

  describe('mergeConfig()', () => {
    it('should merge user config with defaults', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        timeout: 5000
      };

      const merged = mergeConfig(userConfig);

      expect(merged.domain).toBe('noel-accessories.ir');
      expect(merged.timeout).toBe(5000);
      expect(merged.retry).toEqual(DEFAULT_CONFIG.retry);
      expect(merged.cache).toEqual(DEFAULT_CONFIG.cache);
    });

    it('should override retry config', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        retry: {
          enabled: false,
          retries: 1,
          retryDelay: 500
        }
      };

      const merged = mergeConfig(userConfig);

      expect(merged.retry.enabled).toBe(false);
      expect(merged.retry.retries).toBe(1);
      expect(merged.retry.retryDelay).toBe(500);
    });

    it('should partially override retry config', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        retry: {
          retries: 5
        } as any
      };

      const merged = mergeConfig(userConfig);

      expect(merged.retry.enabled).toBe(true); // Default
      expect(merged.retry.retries).toBe(5); // Overridden
      expect(merged.retry.retryDelay).toBe(1000); // Default
    });

    it('should override cache config', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        cache: {
          products: { enabled: false },
          cart: { enabled: true, ttl: 60000 }
        }
      };

      const merged = mergeConfig(userConfig);

      expect(merged.cache.products.enabled).toBe(false);
      expect(merged.cache.cart.enabled).toBe(true);
      expect(merged.cache.cart.ttl).toBe(60000);
      // Others should remain default
      expect(merged.cache.categories).toEqual(DEFAULT_CONFIG.cache.categories);
    });

    it('should set debug mode', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        debug: true
      };

      const merged = mergeConfig(userConfig);

      expect(merged.debug).toBe(true);
    });

    it('should use custom fetch API if provided', () => {
      const customFetch = jest.fn() as any;
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir',
        customFetchApi: customFetch
      };

      const merged = mergeConfig(userConfig);

      expect(merged.customFetchApi).toBe(customFetch);
    });

    it('should use global fetch if available and not provided', () => {
      const userConfig: SazitoConfig = {
        domain: 'noel-accessories.ir'
      };

      const merged = mergeConfig(userConfig);

      // In test environment, fetch might not be available
      if (typeof fetch !== 'undefined') {
        expect(merged.customFetchApi).toBeDefined();
      } else {
        expect(merged.customFetchApi).toBeUndefined();
      }
    });

    it('should preserve all user-provided values', () => {
      const userConfig: SazitoConfig = {
        domain: 'mystore.com',
        timeout: 15000,
        debug: true,
        retry: {
          enabled: true,
          retries: 2,
          retryDelay: 2000
        },
        cache: {
          products: { enabled: true, ttl: 120000 }
        }
      };

      const merged = mergeConfig(userConfig);

      expect(merged.domain).toBe('mystore.com');
      expect(merged.timeout).toBe(15000);
      expect(merged.debug).toBe(true);
      expect(merged.retry.retries).toBe(2);
      expect(merged.cache.products.ttl).toBe(120000);
    });
  });
});
