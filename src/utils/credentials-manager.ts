/**
 * Credentials Manager for guest users
 * Manages cart, invoice, shipping, and payment credentials.
 * Accepts an optional StorageAdapter — defaults to localStorage in browsers,
 * in-memory otherwise (SSR / server actions).
 */

import {
  CartCredentials,
  InvoiceCredentials,
  ShippingAddressCredentials,
  PaymentCredentials
} from '../types';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

function defaultStorage(): StorageAdapter {
  if (
    typeof window !== 'undefined' &&
    typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function'
  ) {
    return localStorage as StorageAdapter;
  }
  return new MemoryStorage();
}

export class CredentialsManager {
  private readonly CART_KEY = 'CART_CREDENTIALS';
  private readonly INVOICE_KEY = 'INVOICE_CREDENTIALS';
  private readonly SHIPPING_KEY = 'SHIPPING_ADDRESS_CREDENTIALS';
  private readonly PAYMENT_KEY = 'PAYMENT_CREDENTIALS';
  private readonly DISCOUNT_KEY = 'DISCOUNT_CODE_INFO';

  private storage: StorageAdapter;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? defaultStorage();
  }

  /**
   * Cart Credentials
   */
  getCartCredentials(): CartCredentials | null {
    const credentials = this.getItem<CartCredentials & { id?: unknown }>(this.CART_KEY);
    const identifier = credentials?.identifier?.trim();
    return identifier ? { identifier } : null;
  }

  setCartCredentials(credentials: CartCredentials & { id?: number }): void {
    const identifier = credentials.identifier.trim();

    if (!identifier) {
      throw new Error('Cart identifier is required.');
    }

    this.setItem(this.CART_KEY, { identifier });
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

  private getItem<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      // noop — storage may be unavailable
    }
  }

  private removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
      // noop
    }
  }
}
