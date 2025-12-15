/**
 * Tests for CredentialsManager
 */

import { CredentialsManager } from '../credentials-manager';
import type {
  CartCredentials,
  InvoiceCredentials,
  ShippingAddressCredentials,
  PaymentCredentials
} from '../../types';

describe('CredentialsManager', () => {
  let credentialsManager: CredentialsManager;

  beforeEach(() => {
    credentialsManager = new CredentialsManager();
    localStorage.clear();
  });

  describe('Cart Credentials', () => {
    it('should set and get cart credentials', () => {
      const cartCreds: CartCredentials = {
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      };

      credentialsManager.setCartCredentials(cartCreds);
      const retrieved = credentialsManager.getCartCredentials();

      expect(retrieved).toEqual(cartCreds);
    });

    it('should return null when no cart credentials exist', () => {
      const retrieved = credentialsManager.getCartCredentials();
      expect(retrieved).toBeNull();
    });

    it('should clear cart credentials', () => {
      const cartCreds: CartCredentials = {
        id: 0,
        identifier: '019b1e71-5dae-733b-9ec6-162214fc4223'
      };

      credentialsManager.setCartCredentials(cartCreds);
      credentialsManager.clearCartCredentials();

      expect(credentialsManager.getCartCredentials()).toBeNull();
    });
  });

  describe('Invoice Credentials', () => {
    it('should set and get invoice credentials', () => {
      const invoiceCreds: InvoiceCredentials = {
        invoiceId: 'inv-123',
        invoiceIdentifier: 'inv-abc'
      };

      credentialsManager.setInvoiceCredentials(invoiceCreds);
      const retrieved = credentialsManager.getInvoiceCredentials();

      expect(retrieved).toEqual(invoiceCreds);
    });

    it('should return null when no invoice credentials exist', () => {
      const retrieved = credentialsManager.getInvoiceCredentials();
      expect(retrieved).toBeNull();
    });

    it('should clear invoice credentials', () => {
      const invoiceCreds: InvoiceCredentials = {
        invoiceId: 'inv-123',
        invoiceIdentifier: 'inv-abc'
      };

      credentialsManager.setInvoiceCredentials(invoiceCreds);
      credentialsManager.clearInvoiceCredentials();

      expect(credentialsManager.getInvoiceCredentials()).toBeNull();
    });
  });

  describe('Shipping Credentials', () => {
    it('should set and get shipping credentials', () => {
      const shippingCreds: ShippingAddressCredentials = {
        shippingAddressId: 'addr-123'
      };

      credentialsManager.setShippingCredentials(shippingCreds);
      const retrieved = credentialsManager.getShippingCredentials();

      expect(retrieved).toEqual(shippingCreds);
    });

    it('should clear shipping credentials', () => {
      const shippingCreds: ShippingAddressCredentials = {
        shippingAddressId: 'addr-123'
      };

      credentialsManager.setShippingCredentials(shippingCreds);
      credentialsManager.clearShippingCredentials();

      expect(credentialsManager.getShippingCredentials()).toBeNull();
    });
  });

  describe('Payment Credentials', () => {
    it('should set and get payment credentials', () => {
      const paymentCreds: PaymentCredentials = {
        paymentId: 'pay-123'
      };

      credentialsManager.setPaymentCredentials(paymentCreds);
      const retrieved = credentialsManager.getPaymentCredentials();

      expect(retrieved).toEqual(paymentCreds);
    });

    it('should clear payment credentials', () => {
      const paymentCreds: PaymentCredentials = {
        paymentId: 'pay-123'
      };

      credentialsManager.setPaymentCredentials(paymentCreds);
      credentialsManager.clearPaymentCredentials();

      expect(credentialsManager.getPaymentCredentials()).toBeNull();
    });
  });

  describe('Discount Code', () => {
    it('should set and get discount code', () => {
      credentialsManager.setDiscountCode('SUMMER2025');
      const code = credentialsManager.getDiscountCode();

      expect(code).toBe('SUMMER2025');
    });

    it('should return null when no discount code exists', () => {
      const code = credentialsManager.getDiscountCode();
      expect(code).toBeNull();
    });

    it('should clear discount code', () => {
      credentialsManager.setDiscountCode('SUMMER2025');
      credentialsManager.clearDiscountCode();

      expect(credentialsManager.getDiscountCode()).toBeNull();
    });
  });

  describe('clearAll()', () => {
    it('should clear all credentials at once', () => {
      credentialsManager.setCartCredentials({ cartId: 'cart-123', cartIdentifier: 'abc' });
      credentialsManager.setInvoiceCredentials({ invoiceId: 'inv-123', invoiceIdentifier: 'xyz' });
      credentialsManager.setShippingCredentials({ shippingAddressId: 'addr-123' });
      credentialsManager.setPaymentCredentials({ paymentId: 'pay-123' });
      credentialsManager.setDiscountCode('DISCOUNT');

      credentialsManager.clearAll();

      expect(credentialsManager.getCartCredentials()).toBeNull();
      expect(credentialsManager.getInvoiceCredentials()).toBeNull();
      expect(credentialsManager.getShippingCredentials()).toBeNull();
      expect(credentialsManager.getPaymentCredentials()).toBeNull();
      expect(credentialsManager.getDiscountCode()).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('CART_CREDENTIALS', 'invalid-json{');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = credentialsManager.getCartCredentials();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully when setting', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const originalSetItem = localStorage.setItem;
      
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        credentialsManager.setCartCredentials({ id: 0, identifier: '019b1e71-5dae-733b-9ec6-162214fc4223' });
      }).not.toThrow();

      expect(localStorage.setItem).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Sazito SDK] Error writing'),
        expect.any(Error)
      );

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('SSR environment handling', () => {
    let originalLocalStorage: any;

    beforeEach(() => {
      originalLocalStorage = global.localStorage;
    });

    afterEach(() => {
      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    it('should return null when localStorage is not available', () => {
      delete (global as any).localStorage;

      const result = credentialsManager.getCartCredentials();
      expect(result).toBeNull();

      global.localStorage = originalLocalStorage;
    });

    it('should not throw when setting credentials without localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete (global as any).localStorage;

      expect(() => {
        credentialsManager.setCartCredentials({ id: 0, identifier: '019b1e71-5dae-733b-9ec6-162214fc4223' });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('localStorage not available')
      );

      consoleSpy.mockRestore();
      global.localStorage = originalLocalStorage;
    });
  });
});
