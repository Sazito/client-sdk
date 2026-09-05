/**
 * Payments API
 */

import { HttpClient } from '../core/http-client';
import { CredentialsManager } from '../utils/credentials-manager';
import {
  SazitoResponse,
  SazitoError,
  PaymentMethod,
  Payment,
  PaymentCredentials,
  PaymentAction,
  CheckoutOrder,
  PaymentStepInput,
  PaymentStepFormFields,
  VerifyPaymentCallbackInput,
  PaymentCallbackFields,
  PaymentCallbackFieldValue,
  PaymentPollingOptions,
  RequestOptions,
  JsonValue,
  JsonObject
} from '../types';
import { PAYMENTS_API, PINCH_API } from '../constants/endpoints';
import {
  transformCheckoutOrderResponse,
  transformPaymentMethodsResponse
} from '../utils/transformers';

export class PaymentsAPI {
  private readonly pinchedPayments = new Set<number>();

  constructor(
    private http: HttpClient,
    private credentials: CredentialsManager,
    private paymentsBasePath: string = PAYMENTS_API
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
      `${this.paymentsBasePath}/list`,
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
      this.paymentsBasePath,
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
    return this.submitJsonPaymentStep(undefined, options);
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
    if (!input) {
      return this.getPaymentStep(options);
    }

    const credentials = this.resolvePaymentCredentials(input.id, input.paymentIdentifier);
    if ('error' in credentials) {
      return { error: credentials.error };
    }

    return this.verifyPaymentCallback({
      paymentId: credentials.data.id,
      paymentIdentifier: credentials.data.identifier,
      body: this.paymentStepInputToCallbackFields(input)
    }, options);
  }

  /**
   * Verify a gateway callback using Sazito's SSR form contract. Body fields
   * are written first, query fields second, and every field is wrapped as
   * `payload[name]`. The validated path identifier is always written last.
   */
  async verifyPaymentCallback(
    input: VerifyPaymentCallbackInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const paymentId = this.normalizePaymentId(input.paymentId);
    const paymentIdentifier = input.paymentIdentifier?.trim();
    if (paymentId === null || !paymentIdentifier) {
      return {
        error: {
          message: 'Invalid payment callback credentials.',
          type: 'validation'
        }
      };
    }

    const form = new URLSearchParams();
    const fields = { ...(input.body ?? {}), ...(input.query ?? {}) };
    for (const [name, value] of Object.entries(fields)) {
      this.appendCallbackValue(form, `payload[${name}]`, value);
    }
    form.set('payment_identifier', paymentIdentifier);

    const response = await this.http.post<PaymentAction>(
      `${this.paymentsBasePath}/${encodeURIComponent(String(paymentId))}/process_payment_step`,
      form,
      {
        ...options,
        headers: this.withContentType(options?.headers, 'application/x-www-form-urlencoded;charset=UTF-8'),
        skipTransform: true
      }
    );

    return this.finalizeStepResponse(response, paymentId, options);
  }

  /** Send one JSON payment status request. Used by pending polling only. */
  async getPaymentStep(options?: RequestOptions): Promise<SazitoResponse<PaymentAction>> {
    return this.submitJsonPaymentStep(undefined, options);
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
    return this.submitJsonPaymentStep(input, options);
  }

  /**
   * Shared JSON core for initialization, status checks and multi-step payment
   * actions. Gateway callback verification intentionally uses form encoding.
   */
  private async submitJsonPaymentStep(
    input: PaymentStepInput | undefined,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const credentials = this.resolvePaymentCredentials(input?.id, input?.paymentIdentifier);
    if ('error' in credentials) return { error: credentials.error };
    const paymentCreds = credentials.data;

    const response = await this.http.post<PaymentAction>(
      `${this.paymentsBasePath}/${paymentCreds.id}/process_payment_step`,
      this.buildProcessStepBody(input, paymentCreds.identifier),
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
      `${this.paymentsBasePath}/${paymentCreds.id}/process_payment_step`,
      formData,
      { ...options, skipTransform: true }
    );

    return this.finalizeStepResponse(response, paymentCreds.id, options);
  }

  /**
   * Poll payment state every 15 seconds until action changes from pending.
   */
  async pollUntilSettled(
    options?: PaymentPollingOptions,
    intervalMs: number = 15000
  ): Promise<SazitoResponse<PaymentAction>> {
    const interval = options?.intervalMs ?? intervalMs;
    const pollingTimeoutMs = options?.pollingTimeoutMs ?? 300000;
    const maxAttempts = options?.maxAttempts;
    const startedAt = Date.now();
    let attempt = 0;
    let terminalResponse: SazitoResponse<PaymentAction> | undefined;

    if (!Number.isFinite(interval) || interval < 0 ||
        !Number.isFinite(pollingTimeoutMs) || pollingTimeoutMs <= 0 ||
        (maxAttempts !== undefined && (!Number.isInteger(maxAttempts) || maxAttempts <= 0))) {
      return { error: { message: 'Invalid payment polling options.', type: 'validation' } };
    }

    while (!terminalResponse) {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= pollingTimeoutMs ||
          (maxAttempts !== undefined && attempt >= maxAttempts)) {
        return { error: { message: 'Payment verification timed out.', type: 'network' } };
      }

      if (!options?.immediate || attempt > 0) {
        const waitResult = await this.waitForPoll(
          Math.min(interval, pollingTimeoutMs - elapsed),
          options?.signal
        );
        if (waitResult) return waitResult;
      }

      if (Date.now() - startedAt >= pollingTimeoutMs) {
        return { error: { message: 'Payment verification timed out.', type: 'network' } };
      }

      attempt += 1;
      const response = await this.getPaymentStep(options);
      if (!response.data || response.data.action !== 'pending') terminalResponse = response;
    }

    return terminalResponse;
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

  private resolvePaymentCredentials(
    callbackId?: number,
    callbackIdentifier?: string
  ): { data: PaymentCredentials } | { error: SazitoError } {
    const identifier = callbackIdentifier?.trim();
    if (callbackId != null || callbackIdentifier != null) {
      if (!Number.isSafeInteger(callbackId) || Number(callbackId) <= 0 || !identifier) {
        return {
          error: {
            message: 'Invalid payment callback credentials.',
            type: 'validation'
          }
        };
      }

      const credentials = { id: Number(callbackId), identifier };
      this.credentials.setPaymentCredentials(credentials);
      return { data: credentials };
    }

    const stored = this.credentials.getPaymentCredentials();
    if (!stored) {
      return {
        error: {
          message: 'No payment found. Please create a payment first.',
          type: 'validation'
        }
      };
    }
    return { data: stored };
  }

  private normalizePaymentId(value: string | number): number | null {
    const id = typeof value === 'string' && value.trim() ? Number(value) : value;
    return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  private paymentStepInputToCallbackFields(input: PaymentStepInput): PaymentCallbackFields {
    const fields: PaymentCallbackFields = { ...(input.payload ?? {}) };
    if (input.tatoken !== undefined) fields.tatoken = input.tatoken;
    if (input.trackingData !== undefined) fields.trackingData = input.trackingData;
    if (input.isFailed !== undefined) fields.isFailed = input.isFailed;
    if (input.imageUrl !== undefined) fields.imageUrl = input.imageUrl;
    if (input.code !== undefined) fields.code = input.code;
    return fields;
  }

  private appendCallbackValue(
    form: URLSearchParams,
    name: string,
    value: PaymentCallbackFieldValue
  ): void {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => this.appendCallbackValue(form, name, entry));
      return;
    }
    if (value === null) {
      form.append(name, '');
      return;
    }
    form.append(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  private withContentType(
    headers: Record<string, string> | undefined,
    contentType: string
  ): Record<string, string> {
    const nextHeaders = { ...(headers ?? {}) };
    delete nextHeaders['Content-Type'];
    delete nextHeaders['content-type'];
    return { ...nextHeaders, 'Content-Type': contentType };
  }

  private waitForPoll(
    intervalMs: number,
    signal?: AbortSignal
  ): Promise<SazitoResponse<PaymentAction> | null> {
    if (signal?.aborted) {
      return Promise.resolve({
        error: { message: 'Payment verification cancelled.', type: 'network' }
      });
    }

    return new Promise((resolve) => {
      const onAbort = () => {
        clearTimeout(timeoutId);
        resolve({ error: { message: 'Payment verification cancelled.', type: 'network' } });
      };
      const timeoutId = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve(null);
      }, intervalMs);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
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
        return { action: 'POST', address: action.address, payload: action.payload, message, raw: action };
      case 'REDIRECT':
        return typeof action.address === 'string'
          ? { action: 'REDIRECT', address: action.address, message, raw: action }
          : null;
      case 'UPLOAD':
        return { action: 'UPLOAD', time: this.optionalNumber(action.time), message, raw: action };
      case 'show_otp_modal':
        return { action: 'show_otp_modal', time: this.optionalNumber(action.time), message, raw: action };
      case 'show_order':
      case 'pending': {
        if (!action.order || typeof action.order !== 'object' || Array.isArray(action.order)) return null;
        const order = transformCheckoutOrderResponse<CheckoutOrder>(action.order);
        if (!this.isCheckoutOrder(order)) return null;
        return actionName === 'show_order'
          ? { action: 'show_order', order, message, raw: action }
          : { action: 'pending', order, message, raw: action };
      }
      case 'payment_fail_error':
        return { action: 'payment_fail_error', message, raw: action };
      case 'show_error':
        return { action: 'show_error', message, raw: action };
      case 'FAIL':
        return { action: 'FAIL', message, raw: action };
      case 'StockViolated':
        return { action: 'StockViolated', message, raw: action };
      default:
        return actionName
          ? { action: 'unknown', backendAction: actionName, raw: action, message }
          : null;
    }
  }

  private optionalNumber(value: JsonValue | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private isPostPayload(value: JsonValue | undefined): value is Record<string, string | number> {
    return !!value && typeof value === 'object' && !Array.isArray(value) &&
      Object.values(value).every((entry) => typeof entry === 'string' || typeof entry === 'number');
  }

  private isCheckoutOrder(order: CheckoutOrder): boolean {
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
      (invoice.netTotal === undefined ||
        (typeof invoice.netTotal === 'number' && Number.isFinite(invoice.netTotal))) &&
      (invoice.finalTotal === undefined ||
        (typeof invoice.finalTotal === 'number' && Number.isFinite(invoice.finalTotal))) &&
      invoice.invoiceItems.every((item) =>
        isPublicId(item.productVariantId) &&
        typeof item.name === 'string' &&
        Array.isArray(item.variantAttributes) &&
        item.variantAttributes.every((attribute) =>
          typeof attribute.name === 'string' && typeof attribute.value === 'string'
        ) &&
        typeof item.singleItemPrice === 'number' && Number.isFinite(item.singleItemPrice) &&
        typeof item.noOfItems === 'number' && Number.isFinite(item.noOfItems) &&
        typeof item.totalItemsPrice === 'number' && Number.isFinite(item.totalItemsPrice) &&
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
