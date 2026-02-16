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
import { PAYMENTS_API, PINCH_API } from '../constants/endpoints';
import { transformPaymentMethodsResponse } from '../utils/transformers';

export class PaymentsAPI {
  private readonly pinchedPayments = new Set<number>();

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

    const response = await this.http.post<any>(
      `${PAYMENTS_API}/list`,
      {
        invoice_id: invoiceCreds.id,
        invoice_identifier: invoiceCreds.identifier
      },
      options
    );

    if (response.data) {
      return { data: transformPaymentMethodsResponse(response.data) as PaymentMethod[] };
    }

    return response;
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

    const response = await this.http.post<any>(
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
      const payment = response.data as Payment;
      this.credentials.setPaymentCredentials({
        id: payment.id,
        identifier: payment.identifier
      });

      return { data: payment };
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

    const response = await this.http.post<PaymentAction>(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      {
        payment_identifier: paymentCreds.identifier
      },
      options
    );

    if (!response.data) {
      return response;
    }

    const normalizedAction = this.normalizeAction(response.data);
    await this.callPinchAfterSuccessfulPayment(normalizedAction, paymentCreds.id, options);
    return { data: normalizedAction };
  }

  /**
   * Process payment step (for card-to-card or multi-step payments)
   */
  async processStep(
    input: PaymentStepInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const paymentCreds = this.credentials.getPaymentCredentials();

    if (!paymentCreds) {
      return {
        error: {
          message: 'No payment found',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<PaymentAction>(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      {
        payment_identifier: paymentCreds.identifier,
        ...input
      },
      options
    );

    if (!response.data) {
      return response;
    }

    const normalizedAction = this.normalizeAction(response.data);
    await this.callPinchAfterSuccessfulPayment(normalizedAction, paymentCreds.id, options);
    return { data: normalizedAction };
  }

  /**
   * Poll payment state every 15 seconds until action changes from pending.
   */
  async pollUntilSettled(
    options?: RequestOptions,
    intervalMs: number = 15000
  ): Promise<SazitoResponse<PaymentAction>> {
    let isPending = true;
    while (isPending) {
      const response = await this.initialize(options);
      if (!response.data) {
        return response;
      }

      if (response.data.action !== 'pending') {
        isPending = false;
        return response;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      error: {
        message: 'Payment polling exited unexpectedly',
        type: 'network'
      }
    };
  }

  /**
   * Clear payment credentials
   */
  clearPayment(): void {
    this.credentials.clearPaymentCredentials();
  }

  private normalizeAction(action: any): PaymentAction {
    if (action?.action === 'show_order') {
      return {
        ...action,
        action: 'showOrder'
      } as PaymentAction;
    }

    return action as PaymentAction;
  }

  private async callPinchAfterSuccessfulPayment(
    action: PaymentAction,
    paymentId: number,
    options?: RequestOptions
  ): Promise<void> {
    if (action.action !== 'showOrder') {
      return;
    }

    if (this.pinchedPayments.has(paymentId)) {
      return;
    }

    this.pinchedPayments.add(paymentId);
    const pinchResponse = await this.http.post<any>(`${PINCH_API}/order`, {}, options);
    if (pinchResponse.error) {
      this.pinchedPayments.delete(paymentId);
    }
  }
}
