/**
 * Invoices API (Checkout)
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  Invoice,
  ShippingMethod,
  ShippingAssignment,
  RequestOptions
} from '../types';
import { INVOICES_API } from '../constants/endpoints';

export class InvoicesAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  /**
   * Get current invoice
   */
  async get(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found. Please create an invoice first.',
          type: 'validation'
        }
      };
    }

    return this.http.get<Invoice>(`${INVOICES_API}/${invoiceCreds.id}`, {
      ...options,
      params: { identifier: invoiceCreds.identifier }
    });
  }

  /**
   * Create a new invoice from cart
   */
  async create(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const cartCreds = this.credentials.getCartCredentials();

    if (!cartCreds) {
      return {
        error: {
          message: 'No cart found. Please create a cart first.',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<Invoice>(
      INVOICES_API,
      {
        cart_id: cartCreds.id,
        cart_identifier: cartCreds.identifier
      },
      options
    );

    // Store invoice credentials
    if (response.data) {
      this.credentials.setInvoiceCredentials({
        id: response.data.id,
        identifier: response.data.identifier
      });
    }

    return response;
  }

  /**
   * Refresh invoice (sync with cart)
   */
  async refresh(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const cartCreds = this.credentials.getCartCredentials();
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!cartCreds || !invoiceCreds) {
      return {
        error: {
          message: 'No cart or invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Invoice>(
      `/api/v1/invoices/${invoiceCreds.id}/refresh`,
      {
        cart_id: cartCreds.id,
        cart_identifier: cartCreds.identifier,
        identifier: invoiceCreds.identifier
      },
      options
    );
  }

  /**
   * Add shipping address to invoice
   */
  async addShippingAddress(
    shippingAddressId: number,
    shippingAddressIdentifier: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const cartCreds = this.credentials.getCartCredentials();
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!cartCreds || !invoiceCreds) {
      return {
        error: {
          message: 'No cart or invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Invoice>(
      `/api/v1/invoices/${invoiceCreds.id}/add_shipping_address`,
      {
        identifier: invoiceCreds.identifier,
        shipping_address_id: shippingAddressId,
        shipping_address_identifier: shippingAddressIdentifier,
        cart_id: cartCreds.id,
        cart_identifier: cartCreds.identifier
      },
      options
    );
  }

  /**
   * Add discount code to invoice
   */
  async addDiscountCode(
    code: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<Invoice>(
      `/api/v1/invoices/${invoiceCreds.id}/add_discount_code`,
      {
        identifier: invoiceCreds.identifier,
        discount_code: code.toUpperCase()
      },
      options
    );

    // Save discount code
    if (response.data) {
      this.credentials.setDiscountCode(code);
    }

    return response;
  }

  /**
   * Assign shipping method to invoice
   */
  async assignShippingMethod(
    shippings: ShippingAssignment[],
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Invoice>(
      `/api/v1/invoices/${invoiceCreds.id}/add_shipping_method`,
      {
        identifier: invoiceCreds.identifier,
        shippings
      },
      options
    );
  }

  /**
   * Add invoice details (user comment)
   */
  async addDetails(
    comment: string,
    options?: RequestOptions
  ): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.post<Invoice>(
      `/api/v1/invoices/${invoiceCreds.id}/add_invoice_details`,
      {
        identifier: invoiceCreds.identifier,
        user_comment: comment
      },
      options
    );
  }

  /**
   * Get applicable shipping methods for invoice
   */
  async getApplicableShippingMethods(
    options?: RequestOptions
  ): Promise<SazitoResponse<ShippingMethod[]>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.get<ShippingMethod[]>(
      `/api/v1/invoices/${invoiceCreds.id}/applicable_shipping_methods`,
      {
        ...options,
        params: { identifier: invoiceCreds.identifier }
      }
    );
  }

  /**
   * Clear current invoice credentials
   */
  clearInvoice(): void {
    this.credentials.clearInvoiceCredentials();
  }
}
