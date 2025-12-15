/**
 * Credentials Manager for guest users
 * Manages cart, invoice, shipping, and payment credentials in localStorage
 */

import {
  CartCredentials,
  InvoiceCredentials,
  ShippingAddressCredentials,
  PaymentCredentials
} from '../types';

export class CredentialsManager {
  private readonly CART_KEY = 'CART_CREDENTIALS';
  private readonly INVOICE_KEY = 'INVOICE_CREDENTIALS';
  private readonly SHIPPING_KEY = 'SHIPPING_ADDRESS_CREDENTIALS';
  private readonly PAYMENT_KEY = 'PAYMENT_CREDENTIALS';
  private readonly DISCOUNT_KEY = 'DISCOUNT_CODE_INFO';

  /**
   * Cart Credentials
   */
  getCartCredentials(): CartCredentials | null {
    return this.getItem<CartCredentials>(this.CART_KEY);
  }

  setCartCredentials(credentials: CartCredentials): void {
    this.setItem(this.CART_KEY, credentials);
  }

  clearCartCredentials(): void {
    this.removeItem(this.CART_KEY);
  }

  /**
   * Invoice Credentials
   */
  getInvoiceCredentials(): InvoiceCredentials | null {
    return this.getItem<InvoiceCredentials>(this.INVOICE_KEY);
  }

  setInvoiceCredentials(credentials: InvoiceCredentials): void {
    this.setItem(this.INVOICE_KEY, credentials);
  }

  clearInvoiceCredentials(): void {
    this.removeItem(this.INVOICE_KEY);
  }

  /**
   * Shipping Address Credentials
   */
  getShippingCredentials(): ShippingAddressCredentials | null {
    return this.getItem<ShippingAddressCredentials>(this.SHIPPING_KEY);
  }

  setShippingCredentials(credentials: ShippingAddressCredentials): void {
    this.setItem(this.SHIPPING_KEY, credentials);
  }

  clearShippingCredentials(): void {
    this.removeItem(this.SHIPPING_KEY);
  }

  /**
   * Payment Credentials
   */
  getPaymentCredentials(): PaymentCredentials | null {
    return this.getItem<PaymentCredentials>(this.PAYMENT_KEY);
  }

  setPaymentCredentials(credentials: PaymentCredentials): void {
    this.setItem(this.PAYMENT_KEY, credentials);
  }

  clearPaymentCredentials(): void {
    this.removeItem(this.PAYMENT_KEY);
  }

  /**
   * Discount Code
   */
  getDiscountCode(): string | null {
    return this.getItem<string>(this.DISCOUNT_KEY);
  }

  setDiscountCode(code: string): void {
    this.setItem(this.DISCOUNT_KEY, code);
  }

  clearDiscountCode(): void {
    this.removeItem(this.DISCOUNT_KEY);
  }

  /**
   * Clear all credentials
   */
  clearAll(): void {
    this.clearCartCredentials();
    this.clearInvoiceCredentials();
    this.clearShippingCredentials();
    this.clearPaymentCredentials();
    this.clearDiscountCode();
  }

  /**
   * Get item from localStorage
   */
  private getItem<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[Sazito SDK] Error reading ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  private setItem<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') {
      console.warn('[Sazito SDK] localStorage not available');
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Sazito SDK] Error writing ${key} to localStorage:`, error);
    }
  }

  /**
   * Remove item from localStorage
   */
  private removeItem(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Sazito SDK] Error removing ${key} from localStorage:`, error);
    }
  }
}
