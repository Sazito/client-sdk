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
  PaymentStepFormFields,
  RequestOptions,
  JsonValue,
  JsonObject
} from '../types';
import { PAYMENTS_API, PINCH_API } from '../constants/endpoints';
import { transformPaymentMethodsResponse, transformRequestKeys } from '../utils/transformers';

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

    const response = await this.http.post<JsonValue>(
      `${PAYMENTS_API}/list`,
      {
        invoice_identifier: invoiceCreds.identifier
      },
      options
    );

    if (response.data) {
      return { data: transformPaymentMethodsResponse<PaymentMethod[]>(response.data) };
    }

    if (response.error) {
      return { error: response.error };
    }

    return { data: [] };
  }

  /**
   * Create payment
   */
  async create(
    paymentTypeId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Payment>> {
    if (!Number.isInteger(paymentTypeId) || paymentTypeId <= 0) {
      return {
        error: {
          message: 'Invalid paymentTypeId. Provide a positive integer from payments.getMethods().',
          type: 'validation'
        }
      };
    }

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
        invoice_identifier: invoiceCreds.identifier,
        payment_type: paymentTypeId
      },
      options
    );

    // Store payment credentials
    if (response.data) {
      const payment = this.normalizePayment(response.data as Payment | JsonObject);
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
        paymentIdentifier: paymentCreds.identifier
      },
      this.withExactJsonHeader(options)
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

    const { paymentIdentifier, ...restInput } = input;

    const response = await this.http.post<PaymentAction>(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      {
        paymentIdentifier: paymentIdentifier || paymentCreds.identifier,
        ...restInput
      },
      this.withExactJsonHeader(options)
    );

    if (!response.data) {
      return response;
    }

    const normalizedAction = this.normalizeAction(response.data);
    await this.callPinchAfterSuccessfulPayment(normalizedAction, paymentCreds.id, options);
    return { data: normalizedAction };
  }

  /**
   * Process payment step in form mode (non-JSON content-type).
   */
  async processStepForm(
    input: FormData | PaymentStepFormFields,
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

    const formData = this.buildProcessStepFormData(input, paymentCreds.identifier);
    if (!formData) {
      return {
        error: {
          message: 'FormData is not available in this runtime.',
          type: 'validation'
        }
      };
    }

    const response = await this.http.post<PaymentAction>(
      `${PAYMENTS_API}/${paymentCreds.id}/process_payment_step`,
      formData,
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

  private withExactJsonHeader(options?: RequestOptions): RequestOptions {
    const headers = { ...(options?.headers || {}) };
    delete headers['Content-Type'];
    delete headers['content-type'];

    return {
      ...options,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    };
  }

  private buildProcessStepFormData(
    input: FormData | PaymentStepFormFields,
    paymentIdentifier: string
  ): FormData | null {
    if (typeof FormData === 'undefined') {
      return null;
    }

    if (input instanceof FormData) {
      if (!input.has('payment_identifier')) {
        input.append('payment_identifier', paymentIdentifier);
      }
      return input;
    }

    const transformedInput = transformRequestKeys(input) as Record<string, JsonValue>;
    const formData = new FormData();

    Object.entries(transformedInput).forEach(([key, value]) => {
      this.appendFormValue(formData, key, value);
    });

    if (!formData.has('payment_identifier')) {
      formData.append('payment_identifier', paymentIdentifier);
    }

    return formData;
  }

  private appendFormValue(formData: FormData, key: string, value: JsonValue): void {
    if (value === undefined) {
      return;
    }

    if (value === null) {
      formData.append(key, '');
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => this.appendFormValue(formData, key, entry));
      return;
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  }

  private normalizePayment(payment: Payment | JsonObject): Payment {
    if (!payment || typeof payment !== 'object') {
      return payment as Payment;
    }

    if (
      'paymentType' in payment
      && payment.paymentType
      && typeof payment.paymentType === 'object'
      && 'title' in payment.paymentType
    ) {
      const paymentTypeWithoutTitle = { ...(payment.paymentType as Record<string, unknown>) };
      delete (paymentTypeWithoutTitle as { title?: unknown }).title;
      return {
        ...(payment as Payment),
        paymentType: paymentTypeWithoutTitle as Payment['paymentType']
      };
    }

    return payment as Payment;
  }

  private normalizeAction(action: PaymentAction | JsonObject): PaymentAction {
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
    const pinchResponse = await this.http.post<JsonValue>(`${PINCH_API}/order`, {}, options);
    if (pinchResponse.error) {
      this.pinchedPayments.delete(paymentId);
    }
  }
}
