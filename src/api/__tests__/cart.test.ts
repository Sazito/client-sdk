/**
 * Tests for Cart API
 */

import { CartAPI } from '../cart';
import { HttpClient } from '../../core/http-client';
import { CredentialsManager } from '../../utils/credentials-manager';
import { mergeConfig } from '../../core/config';
import { mockFetch } from '../../test-helpers/mock-fetch';
import { mockApiResponse } from '../../test-helpers/fixtures';

describe('CartAPI', () => {
  let cartAPI: CartAPI;
  let mockFetchFn: jest.Mock;
  let credentialsManager: CredentialsManager;

  const mockCartResponse = {
    id: 0,
    unique_identifier: '019b1e71-5dae-733b-9ec6-162214fc4223',
    cart_products: [],
    net_total: 0,
    gross_total: 0,
    shipping_method_needed: false,
    delete_coupon: false
  };

  beforeEach(() => {
    localStorage.clear();
    mockFetchFn = mockFetch(mockApiResponse({ cart: mockCartResponse }));
    const config = mergeConfig({
      domain: 'noel-accessories.ir',
      customFetchApi: mockFetchFn
    });
    const httpClient = new HttpClient(config);
    credentialsManager = new CredentialsManager();
    cartAPI = new CartAPI(httpClient, credentialsManager);
  });

  describe('get()', () => {
    it('should get cart with stored credentials', async () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      await cartAPI.get();

      expect(mockFetchFn).toHaveBeenCalled();
      const callUrl = mockFetchFn.mock.calls[0][0];
      expect(callUrl).toContain('/carts/0');
    });

    it('should return error when no cart credentials', async () => {
      const response = await cartAPI.get();

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No cart');
    });
  });

  describe('create()', () => {
    it('should create a new cart', async () => {
      await cartAPI.create({
        variants: [{ id: 456, count: 2 }]
      });

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/carts'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should store cart credentials after creation', async () => {
      mockFetchFn = mockFetch(mockApiResponse({ cart: mockCartResponse }));
      const config = mergeConfig({
        domain: 'noel-accessories.ir',
        customFetchApi: mockFetchFn
      });
      cartAPI = new CartAPI(new HttpClient(config), credentialsManager);

      await cartAPI.create({ variants: [{ id: 456, count: 2 }] });

      const creds = credentialsManager.getCartCredentials();
      expect(creds).toBeDefined();
      expect(creds?.id).toBe(0);
      expect(creds?.identifier).toBe('019b1e71-5dae-733b-9ec6-162214fc4223');
    });

    it('should accept coupon code', async () => {
      await cartAPI.create({
        variants: [{ id: 456, count: 2 }],
        coupon: 'SUMMER2025'
      });

      expect(mockFetchFn).toHaveBeenCalled();
    });
  });

  describe('addItem()', () => {
    it('should add item to existing cart', async () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      await cartAPI.addItem(456, 2);

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/carts/0/add_products_to_cart'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should create cart if none exists', async () => {
      await cartAPI.addItem(456, 2);

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/carts'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should accept form attributes', async () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      await cartAPI.addItem(456, 2, { color: 'red', size: 'L' });

      expect(mockFetchFn).toHaveBeenCalled();
    });
  });

  describe('updateItem()', () => {
    it('should update cart item quantity', async () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      await cartAPI.updateItem(1, 5);

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/carts/0/update_products_in_cart'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should return error when no cart credentials', async () => {
      const response = await cartAPI.updateItem(1, 5);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No cart');
    });
  });

  describe('removeItem()', () => {
    it('should remove item from cart', async () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      await cartAPI.removeItem(1, 456);

      expect(mockFetchFn).toHaveBeenCalledWith(
        expect.stringContaining('/carts/0/remove_products_from_cart'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should return error when no cart credentials', async () => {
      const response = await cartAPI.removeItem(1, 456);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('No cart');
    });
  });

  describe('clearCart()', () => {
    it('should clear cart credentials', () => {
      credentialsManager.setCartCredentials({
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      });

      cartAPI.clearCart();

      expect(credentialsManager.getCartCredentials()).toBeNull();
    });
  });
});
