/**
 * Tests for SazitoClient
 */

import { SazitoClient, createSazitoClient } from '../core/client';
import { mockFetch } from '../test-helpers/mock-fetch';

describe('SazitoClient', () => {
  let client: SazitoClient;
  let mockFetchFn: jest.Mock;

  beforeEach(() => {
    mockFetchFn = mockFetch({ data: { result: {} } });
    client = createSazitoClient({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn,
      debug: false
    });
  });

  describe('Initialization', () => {
    it('should create client with factory function', () => {
      expect(client).toBeInstanceOf(SazitoClient);
    });

    it('should initialize all API modules', () => {
      expect(client.products).toBeDefined();
      expect(client.categories).toBeDefined();
      expect(client.tags).toBeDefined();
      expect(client.cart).toBeDefined();
      expect(client.orders).toBeDefined();
      expect(client.invoices).toBeDefined();
      expect(client.shipping).toBeDefined();
      expect(client.payments).toBeDefined();
      expect(client.users).toBeDefined();
      expect(client.search).toBeDefined();
      expect(client.feedbacks).toBeDefined();
      expect(client.wallet).toBeDefined();
      expect(client.cms).toBeDefined();
      expect(client.images).toBeDefined();
      expect(client.visits).toBeDefined();
      expect(client.booking).toBeDefined();
      expect(client.entityRoutes).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customClient = createSazitoClient({
        domain: 'noel-accessories.ir',
        timeout: 5000,
        debug: true,
        customFetchApi: mockFetchFn
      });

      expect(customClient).toBeInstanceOf(SazitoClient);
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Clear any existing cookies
      client.clearAuth();
    });

    it('should set authentication token', () => {
      client.setAuthToken('test-jwt-token');
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should get authentication token', () => {
      client.setAuthToken('test-jwt-token');
      const token = client.getAuthToken();
      expect(token).toBe('test-jwt-token');
    });

    it('should clear authentication', () => {
      client.setAuthToken('test-jwt-token');
      client.clearAuth();
      expect(client.isAuthenticated()).toBe(false);
      expect(client.getAuthToken()).toBeNull();
    });

    it('should return false for isAuthenticated when no token', () => {
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      expect(() => client.clearCache()).not.toThrow();
    });
  });

  describe('Credentials Management', () => {
    it('should clear credentials', () => {
      expect(() => client.clearCredentials()).not.toThrow();
    });
  });

  describe('Clear All', () => {
    it('should clear auth, cache, and credentials', () => {
      client.setAuthToken('test-token');
      client.clearAll();

      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('API Module Access', () => {
    it('should provide access to products API', () => {
      expect(client.products).toBeDefined();
      expect(typeof client.products.get).toBe('function');
      expect(typeof client.products.list).toBe('function');
      expect(typeof client.products.search).toBe('function');
    });

    it('should provide access to cart API', () => {
      expect(client.cart).toBeDefined();
      expect(typeof client.cart.get).toBe('function');
      expect(typeof client.cart.create).toBe('function');
      expect(typeof client.cart.addItem).toBe('function');
    });

    it('should provide access to orders API', () => {
      expect(client.orders).toBeDefined();
      expect(typeof client.orders.list).toBe('function');
      expect(typeof client.orders.get).toBe('function');
    });

    it('should provide access to users API', () => {
      expect(client.users).toBeDefined();
      expect(typeof client.users.login).toBe('function');
      expect(typeof client.users.register).toBe('function');
    });
  });
});
