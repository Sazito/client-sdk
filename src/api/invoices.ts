/**
 * Invoices API (Checkout)
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  Invoice,
  ApplicableShippingMethods,
  ShippingAssignment,
  RequestOptions
} from '../types';
import { INVOICES_API } from '../constants/endpoints';
import {
  transformApplicableShippingMethodsResponse,
  transformInvoiceResponse
} from '../utils/transformers';

export interface AddInvoiceFormInput {
  formAttributes: Record<string, any>;
  invoiceIdentifier?: string;
  identifier?: string;
}

export class InvoicesAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  private normalizeInvoiceResponse(response: SazitoResponse<any>): SazitoResponse<Invoice> {
    if (!response.data) {
      if (response.error?.status === 423) {
        this.credentials.clearInvoiceCredentials();
      }
      return response;
    }

    return { data: transformInvoiceResponse(response.data) as Invoice };
  }

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

    const response = await this.http.get<any>(`${INVOICES_API}/${invoiceCreds.id}`, {
      ...options,
      params: { identifier: invoiceCreds.identifier }
    });

    return this.normalizeInvoiceResponse(response);
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

    const response = await this.http.post<any>(
      INVOICES_API,
      {
        cart_id: String(cartCreds.id),
        cart_identifier: cartCreds.identifier
      },
      options
    );

    // Store invoice credentials
    if (response.data) {
      const normalizedInvoice = transformInvoiceResponse(response.data) as Invoice;
      this.credentials.setInvoiceCredentials({
        id: normalizedInvoice.id,
        identifier: normalizedInvoice.identifier
      });

      return { data: normalizedInvoice };
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

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/refresh`,
      {
        cart_id: String(cartCreds.id),
        cart_identifier: cartCreds.identifier,
        identifier: invoiceCreds.identifier
      },
      options
    );

    return this.normalizeInvoiceResponse(response);
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

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_shipping_address`,
      {
        identifier: invoiceCreds.identifier,
        shipping_address_id: shippingAddressId,
        shipping_address_identifier: shippingAddressIdentifier,
        cart_id: cartCreds.id,
        cart_identifier: cartCreds.identifier
      },
      options
    );

    return this.normalizeInvoiceResponse(response);
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

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_discount_code`,
      {
        identifier: invoiceCreds.identifier,
        discount_code: code.toUpperCase()
      },
      options
    );

    // Save discount code
    if (response.data) {
      this.credentials.setDiscountCode(code.toUpperCase());
      return { data: transformInvoiceResponse(response.data) as Invoice };
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

    const normalizedShippings = shippings.map((shipping) => ({
      ...shipping,
      invoiceItemIds: shipping.invoiceItemIds.map((invoiceItemId) => String(invoiceItemId))
    }));

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_shipping_method`,
      {
        identifier: invoiceCreds.identifier,
        shippings: normalizedShippings
      },
      options
    );

    return this.normalizeInvoiceResponse(response);
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

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_invoice_details`,
      {
        identifier: invoiceCreds.identifier,
        user_comment: comment
      },
      options
    );

    return this.normalizeInvoiceResponse(response);
  }

  /**
   * Attach checkout dynamic form data to invoice.
   */
  async addForm(
    input: AddInvoiceFormInput,
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

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_form`,
      {
        invoiceIdentifier: input.invoiceIdentifier || input.identifier || invoiceCreds.identifier,
        formAttributes: input.formAttributes
      },
      options
    );

    return this.normalizeInvoiceResponse(response);
  }

  /**
   * Apply wallet credit to invoice.
   */
  async addCredit(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/add_credit`,
      { identifier: invoiceCreds.identifier },
      options
    );

    return this.normalizeInvoiceResponse(response);
  }

  /**
   * Remove wallet credit from invoice.
   */
  async removeCredit(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<any>(
      `${INVOICES_API}/${invoiceCreds.id}/remove_credit`,
      { identifier: invoiceCreds.identifier },
      options
    );

    return this.normalizeInvoiceResponse(response);
  }

  /**
   * Toggle wallet credit based on current invoice state.
   */
  async toggleCredit(options?: RequestOptions): Promise<SazitoResponse<Invoice>> {
    const invoiceResponse = await this.get(options);
    if (!invoiceResponse.data) {
      return invoiceResponse;
    }

    if (invoiceResponse.data.creditTotal > 0) {
      return this.removeCredit(options);
    }

    return this.addCredit(options);
  }

  /**
   * Get applicable shipping methods for invoice
   */
  async getApplicableShippingMethods(
    options?: RequestOptions
  ): Promise<SazitoResponse<ApplicableShippingMethods>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.get<any>(
      `${INVOICES_API}/${invoiceCreds.id}/applicable_shipping_methods`,
      {
        ...options,
        params: { identifier: invoiceCreds.identifier }
      }
    );

    if (response.data) {
      return { data: transformApplicableShippingMethodsResponse(response.data) as ApplicableShippingMethods };
    }

    return response;
  }

  /**
   * Clear current invoice credentials
   */
  clearInvoice(): void {
    this.credentials.clearInvoiceCredentials();
  }
}
