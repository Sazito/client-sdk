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
  Order,
  PaymentStepInput,
  PaymentStepFormFields,
  RequestOptions,
  JsonValue,
  JsonObject
} from '../types';
import { PAYMENTS_API, PINCH_API } from '../constants/endpoints';
import {
  transformOrderResponse,
  transformPaymentMethodsResponse
} from '../utils/transformers';

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

    // Use the raw response: the generic transform maps BOTH `payment_identifier`
    // and `invoice_identifier` to `identifier`, so the invoice value clobbers the
    // payment one. We must read `payment_identifier` directly.
    const response = await this.http.post<JsonObject>(
      PAYMENTS_API,
      {
        invoice_identifier: invoiceCreds.identifier,
        payment_type: paymentTypeId
      },
      { ...options, skipTransform: true }
    );

    if (response.error) {
      return { error: response.error };
    }

    if (response.data) {
      const envelope = response.data as JsonObject;
      const rawPayment = (
        envelope && typeof envelope === 'object' && 'result' in envelope
          ? (envelope.result as JsonObject)?.payment
          : envelope.payment
      ) as JsonObject | undefined;

      if (rawPayment && typeof rawPayment === 'object') {
        const identifier = String(rawPayment.payment_identifier ?? '');
        const id = Number(rawPayment.id ?? 0);
        const rawType = rawPayment.payment_type as JsonObject | undefined;

        const payment: Payment = {
          id,
          identifier,
          amount: Number(rawPayment.payment_amount ?? 0),
          paymentType: {
            id: rawType?.id != null ? Number(rawType.id) : undefined,
            code: (rawType?.reference_code ?? '') as Payment['paymentType']['code']
          }
        };

        if (identifier) {
          this.credentials.setPaymentCredentials({ id, identifier });
        }

        return { data: payment };
      }
    }

    return { data: response.data as unknown as Payment };
  }

  /**
   * Initialize payment: start the payment step before redirecting the user to
   * the gateway. Returns the next {@link PaymentAction} (typically REDIRECT or
   * POST for hosted gateways, or show_order for zero-amount/instant payments).
   */
  async initialize(options?: RequestOptions): Promise<SazitoResponse<PaymentAction>> {
    return this.submitPaymentStep(undefined, options);
  }

  /**
   * Verify payment after the user returns from the gateway. Forwards the
   * gateway callback parameters (e.g. `tatoken`, `trackingData`, `isFailed`,
   * `code`) to the same payment-step endpoint and returns the settled
   * {@link PaymentAction} (show_order on success, FAIL/StockViolated otherwise,
   * or pending if the gateway has not reported back yet).
   */
  async verify(
    input?: PaymentStepInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    return this.submitPaymentStep(input, options);
  }

  /**
   * Process payment step (for card-to-card or multi-step payments).
   *
   * @deprecated Prefer {@link verify} for gateway-return verification.
   */
  async processStep(
    input: PaymentStepInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    return this.submitPaymentStep(input, options);
  }

  /**
   * Shared core for the `process_payment_step` endpoint used by
   * {@link initialize}, {@link verify} and {@link processStep}.
   */
  private async submitPaymentStep(
    input: PaymentStepInput | undefined,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const callbackId = input?.id;
    const callbackIdentifier = input?.paymentIdentifier?.trim();
    if (
      callbackId != null &&
      Number.isInteger(callbackId) &&
      callbackId > 0 &&
      callbackIdentifier
    ) {
      this.credentials.setPaymentCredentials({
        id: callbackId,
        identifier: callbackIdentifier
      });
    }

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
      this.buildProcessStepBody(input, callbackIdentifier || paymentCreds.identifier),
      { ...this.withExactJsonHeader(options), skipRequestTransform: true }
    );

    return this.finalizeStepResponse(response, paymentCreds.id, options);
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
      { ...options, skipTransform: true }
    );

    return this.finalizeStepResponse(response, paymentCreds.id, options);
  }

  /**
   * Poll payment state every 15 seconds until action changes from pending.
   */
  async pollUntilSettled(
    options?: RequestOptions,
    intervalMs: number = 15000
  ): Promise<SazitoResponse<PaymentAction>> {
    let response: SazitoResponse<PaymentAction>;

    do {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      response = await this.verify(undefined, options);
      if (!response.data) {
        return response;
      }
    } while (response.data.action === 'pending');

    return response;
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
      },
      skipTransform: true
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

    const transformedInput = this.buildProcessStepBody(input, paymentIdentifier);
    const formData = new FormData();

    Object.entries(transformedInput).forEach(([key, value]) => {
      this.appendFormValue(formData, key, value);
    });

    if (!formData.has('payment_identifier')) {
      formData.append('payment_identifier', paymentIdentifier);
    }

    return formData;
  }

  private buildProcessStepBody(
    input: PaymentStepInput | PaymentStepFormFields | undefined,
    paymentIdentifier: string
  ): JsonObject {
    const body: JsonObject = { payment_identifier: paymentIdentifier };
    if (!input) return body;

    if ('payload' in input && input.payload !== undefined) body.payload = input.payload;
    if ('tatoken' in input && input.tatoken !== undefined) body.tatoken = input.tatoken;
    if ('trackingData' in input && input.trackingData !== undefined) body.tracking_data = input.trackingData;
    if ('isFailed' in input && input.isFailed !== undefined) body.is_failed = input.isFailed;
    if ('imageUrl' in input && input.imageUrl !== undefined) body.image_url = input.imageUrl;
    if ('code' in input && input.code !== undefined) body.code = input.code;

    return body;
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

  /**
   * Post-process a `process_payment_step` response. The exact-JSON endpoint
   * returns an envelope `{ result: PaymentAction, error, error_code, status }`;
   * unwrap `result`, surface envelope-level errors, and run the pinch hook.
   */
  private async finalizeStepResponse(
    response: SazitoResponse<PaymentAction>,
    paymentId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    if (!response.data) {
      return response;
    }

    const isObj = (v: unknown): v is JsonObject =>
      !!v && typeof v === 'object' && !Array.isArray(v);

    // The backend often replies with `text/plain`, so the body arrives as a raw
    // JSON string. Parse it before unwrapping.
    let parsed: unknown = response.data;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return {
          error: { message: 'Invalid payment step response', type: 'api' }
        };
      }
    }
    const envelope = parsed as JsonObject;

    if (isObj(envelope)) {
      const envError = typeof envelope.error === 'string' ? envelope.error : '';
      const envCode = Number(envelope.error_code ?? 0);
      if (envError || envCode) {
        return {
          error: {
            message: envError || 'Payment step failed',
            type: 'api',
            status: Number(envelope.status) || undefined
          }
        };
      }
    }

    const actionPayload =
      isObj(envelope) && isObj(envelope.result)
        ? envelope.result
        : (envelope as JsonObject);

    const normalizedAction = this.normalizeAction(actionPayload);
    if (!normalizedAction) {
      return {
        error: { message: 'Invalid payment step result', type: 'api' }
      };
    }
    await this.callPinchAfterSuccessfulPayment(normalizedAction, paymentId, options);
    return { data: normalizedAction };
  }

  private normalizeAction(action: JsonObject): PaymentAction | null {
    const actionName = typeof action.action === 'string' ? action.action : '';
    const message = typeof action.message === 'string' ? action.message : undefined;

    switch (actionName) {
      case 'POST':
        if (typeof action.address !== 'string' || !this.isPostPayload(action.payload)) return null;
        return { action: 'POST', address: action.address, payload: action.payload, message };
      case 'REDIRECT':
        return typeof action.address === 'string'
          ? { action: 'REDIRECT', address: action.address, message }
          : null;
      case 'UPLOAD':
        return { action: 'UPLOAD', time: this.optionalNumber(action.time), message };
      case 'show_otp_modal':
        return { action: 'show_otp_modal', time: this.optionalNumber(action.time), message };
      case 'show_order':
      case 'pending': {
        if (!action.order || typeof action.order !== 'object' || Array.isArray(action.order)) return null;
        const order = transformOrderResponse<Order>(action.order);
        if (!this.isCheckoutOrder(order)) return null;
        return actionName === 'show_order'
          ? { action: 'show_order', order, message }
          : { action: 'pending', order, message };
      }
      case 'payment_fail_error':
        return { action: 'payment_fail_error', message };
      case 'show_error':
        return { action: 'show_error', message };
      case 'FAIL':
        return { action: 'FAIL', message };
      case 'StockViolated':
        return { action: 'StockViolated', message };
      default:
        return null;
    }
  }

  private optionalNumber(value: JsonValue | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private isPostPayload(value: JsonValue | undefined): value is Record<string, string | number> {
    return !!value && typeof value === 'object' && !Array.isArray(value) &&
      Object.values(value).every((entry) => typeof entry === 'string' || typeof entry === 'number');
  }

  private isCheckoutOrder(order: Order): boolean {
    const isPublicId = (value: unknown) =>
      (typeof value === 'number' && Number.isFinite(value)) ||
      (typeof value === 'string' && value.length > 0);
    const invoice = order.invoice;

    return isPublicId(order.id) &&
      isPublicId(order.orderNumber) &&
      typeof order.orderIdentifier === 'string' && order.orderIdentifier.length > 0 &&
      !!invoice &&
      Array.isArray(invoice.invoiceItems) &&
      Array.isArray(invoice.shippingItems) &&
      typeof invoice.netTotal === 'number' && Number.isFinite(invoice.netTotal) &&
      typeof invoice.finalTotal === 'number' && Number.isFinite(invoice.finalTotal) &&
      invoice.invoiceItems.every((item) =>
        isPublicId(item.id) &&
        typeof item.productVariantId === 'number' && Number.isFinite(item.productVariantId) &&
        typeof item.name === 'string' &&
        Array.isArray(item.attributes) &&
        item.attributes.every((attribute) =>
          typeof attribute.name === 'string' &&
          (typeof attribute.value === 'string' || typeof attribute.value === 'object')
        ) &&
        typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) &&
        typeof item.quantity === 'number' && Number.isFinite(item.quantity) &&
        typeof item.lineTotal === 'number' && Number.isFinite(item.lineTotal) &&
        typeof item.productVariant?.product?.productType === 'string'
      ) &&
      invoice.shippingItems.every((item) =>
        isPublicId(item.id) &&
        Array.isArray(item.invoiceItemIds) &&
        typeof item.rate?.name === 'string' &&
        typeof item.rate?.price === 'number' && Number.isFinite(item.rate.price)
      );
  }

  private async callPinchAfterSuccessfulPayment(
    action: PaymentAction,
    paymentId: number,
    options?: RequestOptions
  ): Promise<void> {
    if (action.action !== 'show_order') {
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
