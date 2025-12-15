/**
 * Payments API
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  PaymentMethod,
  Payment,
  PaymentAction,
  PaymentStepInput,
  RequestOptions
} from '../types';
import { PAYMENTS_API } from '../constants/endpoints';

export class PaymentsAPI {
  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager
  ) {}

  /**
   * Get list of payment methods for invoice
   */
  async getMethods(options?: RequestOptions): Promise<SazitoResponse<PaymentMethod[]>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    return this.http.post<PaymentMethod[]>(
      `${PAYMENTS_API}/list`,
      {
        invoice_id: invoiceCreds.id,
        invoice_identifier: invoiceCreds.identifier
      },
      options
    );
  }

  /**
   * Create payment
   */
  async create(
    paymentTypeId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Payment>> {
    const invoiceCreds = this.credentials.getInvoiceCredentials();

    if (!invoiceCreds) {
      return {
        error: {
          message: 'No invoice found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<Payment>(
      PAYMENTS_API,
      {
        invoice_id: invoiceCreds.id,
        invoice_identifier: invoiceCreds.identifier,
        payment_type: paymentTypeId
      },
      options
    );

    // Store payment credentials
    if (response.data) {
      this.credentials.setPaymentCredentials({
        id: response.data.id,
        identifier: response.data.identifier
      });
    }

    return response;
  }

  /**
   * Initialize payment (get payment action)
   */
  async initialize(options?: RequestOptions): Promise<SazitoResponse<PaymentAction>> {
    const paymentCreds = this.credentials.getPaymentCredentials();

    if (!paymentCreds) {
      return {
        error: {
          message: 'No payment found. Please create a payment first.',
          type: 'validation'
        }
      };
    }

    return this.http.post<PaymentAction>(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      {
        payment_identifier: paymentCreds.identifier
      },
      options
    );
  }

  /**
   * Process payment step (for card-to-card or multi-step payments)
   */
  async processStep(
    input: PaymentStepInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<any>> {
    const paymentCreds = this.credentials.getPaymentCredentials();

    if (!paymentCreds) {
      return {
        error: {
          message: 'No payment found',
          type: 'validation'
        }
      };
    }

    return this.http.post(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      {
        payment_identifier: paymentCreds.identifier,
        ...input
      },
      options
    );
  }

  /**
   * Clear payment credentials
   */
  clearPayment(): void {
    this.credentials.clearPaymentCredentials();
  }
}
