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
  private verificationTraceSequence = 0;

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
    const traceId = this.nextVerificationTraceId('create');
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
      this.logVerification(traceId, 'validation_failed', { reason: 'No invoice found' });
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

    this.logVerification(traceId, 'create_response_received', response);

    if (response.error) {
      return { error: response.error };
    }

    if (response.data) {
      const envelope = response.data as JsonObject;
      const rawPayment = this.extractPaymentPayload(envelope);

      if (rawPayment && typeof rawPayment === 'object') {
        const identifier = String(
          rawPayment.payment_identifier ?? rawPayment.paymentIdentifier ?? rawPayment.identifier ?? ''
        ).trim();
        const id = Number(rawPayment.id ?? 0);
        const rawType = (rawPayment.payment_type ?? rawPayment.paymentType) as JsonObject | undefined;

        if (this.normalizePaymentId(id, true) === null || !identifier.trim()) {
          this.logVerification(traceId, 'create_response_invalid', {
            candidateKeys: Object.keys(rawPayment),
            paymentId: id,
            hasPaymentIdentifier: Boolean(identifier.trim())
          });
          return { error: {
            message: 'Payment creation response is missing a valid payment ID or identifier.',
            type: 'api'
          } };
        }

        const payment: Payment = {
          id,
          identifier,
          amount: Number(rawPayment.payment_amount ?? rawPayment.paymentAmount ?? rawPayment.amount ?? 0),
          paymentType: {
            id: rawType?.id != null ? Number(rawType.id) : undefined,
            code: (rawType?.reference_code ?? rawType?.referenceCode ?? rawType?.code ?? '') as Payment['paymentType']['code']
          }
        };

        if (identifier) {
          this.credentials.setPaymentCredentials({ id, identifier });
        }

        return { data: payment };
      }
    }

    this.logVerification(traceId, 'create_response_invalid', {
      reason: 'No payment object found',
      responseData: response.data
    });
    return {
      error: {
        message: 'Payment creation response is missing a valid payment ID or identifier.',
        type: 'api'
      }
    };
  }

  /**
   * Initialize payment: start the payment step before redirecting the user to
   * the gateway. Returns the next {@link PaymentAction} (typically REDIRECT or
   * POST for hosted gateways, or show_order for zero-amount/instant payments).
   */
  async initialize(options?: RequestOptions): Promise<SazitoResponse<PaymentAction>> {
    // Keep initialization distinct from a later status poll. The v2 contract's
    // initialize request includes an explicit payload object, even when a
    // gateway (such as Zibal) does not require provider-specific fields.
    return this.submitJsonPaymentStep({ payload: {} }, options, 'initialize');
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
   * Verify a gateway callback using Sazito's form contract. Body fields are
   * written first and query fields second. Gateway field names and casing are
   * preserved, and the validated payment identifier is always written last.
   */
  async verifyPaymentCallback(
    input: VerifyPaymentCallbackInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const traceId = this.nextVerificationTraceId('callback');
    const paymentId = this.normalizePaymentId(input.paymentId);
    const paymentIdentifier = input.paymentIdentifier?.trim();
    this.logVerification(traceId, 'started', {
      paymentId: input.paymentId,
      paymentIdentifier,
      body: input.body,
      query: input.query,
      callbackFieldNames: Object.keys({ ...(input.body ?? {}), ...(input.query ?? {}) })
    });
    if (paymentId === null || !paymentIdentifier) {
      this.logVerification(traceId, 'validation_failed', {
        reason: 'Invalid payment callback credentials',
        normalizedPaymentId: paymentId,
        hasPaymentIdentifier: Boolean(paymentIdentifier)
      });
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
      this.appendCallbackValue(form, name, value);
    }
    form.set('payment_identifier', paymentIdentifier);

    const endpoint =
      `${this.paymentsBasePath}/${encodeURIComponent(String(paymentId))}/process_payment_step`;
    this.logVerification(traceId, 'request_prepared', {
      method: 'POST',
      endpoint,
      contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
      form: Object.fromEntries(form.entries())
    });

    const response = await this.http.post<PaymentAction>(
      endpoint,
      form,
      {
        ...options,
        headers: this.withContentType(options?.headers, 'application/x-www-form-urlencoded;charset=UTF-8'),
        skipTransform: true
      }
    );

    this.logVerification(traceId, 'response_received', response);

    return this.finalizeStepResponse(response, paymentId, options, traceId);
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
    options?: RequestOptions,
    operation: 'initialize' | 'status' = 'status'
  ): Promise<SazitoResponse<PaymentAction>> {
    const traceId = this.nextVerificationTraceId(operation);
    const credentials = this.resolvePaymentCredentials(input?.id, input?.paymentIdentifier);
    if ('error' in credentials) {
      this.logVerification(traceId, 'validation_failed', credentials);
      return { error: credentials.error };
    }
    const paymentCreds = credentials.data;
    const endpoint = `${this.paymentsBasePath}/${paymentCreds.id}/process_payment_step`;
    this.logVerification(traceId, 'request_prepared', {
      method: 'POST', endpoint, contentType: 'application/json',
      credentialSource: input?.id != null || input?.paymentIdentifier != null ? 'input' : 'storage',
      paymentId: paymentCreds.id
    });

    const response = await this.http.post<PaymentAction>(
      endpoint,
      this.buildProcessStepBody(input, paymentCreds.identifier),
      { ...this.withExactJsonHeader(options), skipRequestTransform: true }
    );

    this.logVerification(traceId, 'response_received', response);
    return this.finalizeStepResponse(response, paymentCreds.id, options, traceId);
  }

  /**
   * Process payment step in form mode (non-JSON content-type).
   */
  async processStepForm(
    input: FormData | PaymentStepFormFields,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaymentAction>> {
    const credentials = this.resolvePaymentCredentials();
    if ('error' in credentials) return { error: credentials.error };
    const paymentCreds = credentials.data;
    if (this.normalizePaymentId(paymentCreds.id) === null) {
      return {
        error: {
          message: 'A positive payment ID is required for form callback processing.',
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
    const traceId = this.nextVerificationTraceId('poll');
    const interval = options?.intervalMs ?? intervalMs;
    const pollingTimeoutMs = options?.pollingTimeoutMs ?? 300000;
    const maxAttempts = options?.maxAttempts;
    const startedAt = Date.now();
    let attempt = 0;
    let terminalResponse: SazitoResponse<PaymentAction> | undefined;

    this.logVerification(traceId, 'poll_started', {
      intervalMs: interval,
      pollingTimeoutMs,
      maxAttempts,
      immediate: options?.immediate ?? false,
      signalAborted: options?.signal?.aborted ?? false
    });

    if (!Number.isFinite(interval) || interval < 0 ||
        !Number.isFinite(pollingTimeoutMs) || pollingTimeoutMs <= 0 ||
        (maxAttempts !== undefined && (!Number.isInteger(maxAttempts) || maxAttempts <= 0))) {
      const result = { error: { message: 'Invalid payment polling options.', type: 'validation' as const } };
      this.logVerification(traceId, 'poll_validation_failed', result);
      return result;
    }

    while (!terminalResponse) {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= pollingTimeoutMs ||
          (maxAttempts !== undefined && attempt >= maxAttempts)) {
        const result = { error: { message: 'Payment verification timed out.', type: 'network' as const } };
        this.logVerification(traceId, 'poll_timed_out', { attempt, elapsed, result });
        return result;
      }

      if (!options?.immediate || attempt > 0) {
        const waitResult = await this.waitForPoll(
          Math.min(interval, pollingTimeoutMs - elapsed),
          options?.signal
        );
        if (waitResult) {
          this.logVerification(traceId, 'poll_cancelled', { attempt, result: waitResult });
          return waitResult;
        }
      }

      if (Date.now() - startedAt >= pollingTimeoutMs) {
        const result = { error: { message: 'Payment verification timed out.', type: 'network' as const } };
        this.logVerification(traceId, 'poll_timed_out', {
          attempt,
          elapsed: Date.now() - startedAt,
          result
        });
        return result;
      }

      attempt += 1;
      this.logVerification(traceId, 'poll_request_started', { attempt });
      const response = await this.getPaymentStep(options);
      this.logVerification(traceId, 'poll_response_received', { attempt, response });
      if (!response.data || response.data.action !== 'pending') terminalResponse = response;
    }

    this.logVerification(traceId, 'poll_settled', {
      attempts: attempt,
      elapsedMs: Date.now() - startedAt,
      response: terminalResponse
    });
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
    // V2 sales-flow resources use route id 0 and resolve the concrete payment
    // from its identifier. Gateway-return URLs still carry a positive id and
    // are validated separately above.
    const storedId = this.normalizePaymentId(stored.id, true);
    const storedIdentifier = typeof stored.identifier === 'string' ? stored.identifier.trim() : '';
    if (storedId === null || !storedIdentifier) {
      return { error: {
        message: 'Stored payment credentials are invalid. Restore the payment ID and identifier from the original gateway return URL.',
        type: 'validation'
      } };
    }
    return { data: { id: storedId, identifier: storedIdentifier } };
  }

  /**
   * Payment creation has been returned in a few compatible envelope shapes
   * across v2 deployments: `{ result: { payment: ... } }`, a direct payment
   * under `result`, and (for request-log proxies) under `response.result`.
   * Keep the shape handling here so the credential parser never silently
   * mistakes an invoice identifier for the payment identifier. A zero id is
   * valid for identifier-scoped v2 payment routes.
   */
  private extractPaymentPayload(data: JsonObject): JsonObject | undefined {
    const isObject = (value: JsonValue | undefined): value is JsonObject =>
      Boolean(value && typeof value === 'object' && !Array.isArray(value));

    const candidates: JsonObject[] = [];
    const addCandidate = (value: JsonValue | undefined): void => {
      if (!isObject(value) || candidates.includes(value)) return;
      candidates.push(value);
      if (isObject(value.response)) addCandidate(value.response);
      if (isObject(value.result)) addCandidate(value.result);
      if (isObject(value.payment)) addCandidate(value.payment);
    };
    addCandidate(data);

    return candidates.find((candidate) =>
      isObject(candidate.payment) ||
      candidate.id !== undefined ||
      candidate.payment_identifier !== undefined ||
      candidate.paymentIdentifier !== undefined
    )?.payment as JsonObject | undefined
      ?? candidates.find((candidate) =>
        candidate.id !== undefined ||
        candidate.payment_identifier !== undefined ||
        candidate.paymentIdentifier !== undefined
      );
  }

  private normalizePaymentId(value: string | number, allowZero = false): number | null {
    const id = typeof value === 'string' && value.trim() ? Number(value) : value;
    return typeof id === 'number' &&
      Number.isSafeInteger(id) &&
      (allowZero ? id >= 0 : id > 0)
      ? id
      : null;
  }

  private paymentStepInputToCallbackFields(input: PaymentStepInput): PaymentCallbackFields {
    const fields: PaymentCallbackFields = { ...(input.payload ?? {}) };
    if (input.tatoken !== undefined) fields.tatoken = input.tatoken;
    if (input.trackingData !== undefined) fields.tracking_data = input.trackingData;
    if (input.isFailed !== undefined) fields.is_failed = input.isFailed;
    if (input.imageUrl !== undefined) fields.image_url = input.imageUrl;
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
   * returns an envelope `{ result: PaymentAction, error, error_code, status }`.
   * Some storefront proxies preserve their request log wrapper and return it
   * as `{ method, path, response: <envelope> }`; accept both shapes.
   */
  private async finalizeStepResponse(
    response: SazitoResponse<PaymentAction>,
    paymentId: number,
    options?: RequestOptions,
    traceId?: string
  ): Promise<SazitoResponse<PaymentAction>> {
    if (!response.data) {
      this.logVerification(traceId, 'finished_without_data', response);
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
        this.logVerification(traceId, 'response_parse_failed', {
          rawResponse: response.data
        });
        return {
          error: { message: 'Invalid payment step response', type: 'api' }
        };
      }
    }
    const outerEnvelope = parsed as JsonObject;
    const envelope =
      isObj(outerEnvelope) && isObj(outerEnvelope.response)
        ? outerEnvelope.response
        : outerEnvelope;

    this.logVerification(traceId, 'envelope_unwrapped', {
      hadProxyResponseWrapper: envelope !== outerEnvelope,
      envelope
    });

    if (isObj(envelope)) {
      const envError = typeof envelope.error === 'string' ? envelope.error : '';
      const envCode = Number(envelope.error_code ?? 0);
      if (envError || envCode) {
        this.logVerification(traceId, 'envelope_error', {
          error: envError,
          errorCode: envCode,
          status: envelope.status
        });
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

    this.logVerification(traceId, 'action_extracted', actionPayload);

    const normalizedAction = this.normalizeAction(actionPayload);
    if (!normalizedAction) {
      this.logVerification(traceId, 'action_invalid', {
        reason: 'Missing or malformed payment action fields',
        actionPayload
      });
      return {
        error: { message: 'Invalid payment step result', type: 'api' }
      };
    }
    this.logVerification(traceId, 'action_normalized', normalizedAction);
    await this.callPinchAfterSuccessfulPayment(normalizedAction, paymentId, options, traceId);
    if (normalizedAction.action === 'show_order') {
      // A confirmed order consumes the guest checkout resources. Keeping any
      // of these identifiers would make the storefront reopen the completed
      // cart or reuse its invoice/payment on the next visit.
      this.credentials.clearAll();
      this.logVerification(traceId, 'checkout_credentials_cleared', {
        paymentId,
        orderId: normalizedAction.order.id
      });
    }
    this.logVerification(traceId, 'finished', {
      paymentId,
      action: normalizedAction.action
    });
    return { data: normalizedAction };
  }

  private normalizeAction(action: JsonObject): PaymentAction | null {
    const actionName = typeof action.action === 'string' ? action.action.trim() : '';
    // The v2 payment-step contract currently documents GET-style gateway
    // responses as `redirect`, while older deployments return `REDIRECT`.
    // Normalize known action names here so checkout always receives the
    // canonical PaymentAction discriminants it handles.
    const normalizedActionName = actionName.toLowerCase();
    const message = typeof action.message === 'string' ? action.message : undefined;

    switch (normalizedActionName) {
      case 'post':
        if (typeof action.address !== 'string' || !this.isPostPayload(action.payload)) return null;
        return { action: 'POST', address: action.address, payload: action.payload, message, raw: action };
      case 'redirect':
        return typeof action.address === 'string'
          ? { action: 'REDIRECT', address: action.address, message, raw: action }
          : null;
      case 'upload':
        return { action: 'UPLOAD', time: this.optionalNumber(action.time), message, raw: action };
      case 'show_otp_modal':
        return { action: 'show_otp_modal', time: this.optionalNumber(action.time), message, raw: action };
      case 'show_order':
      case 'pending': {
        if (!action.order || typeof action.order !== 'object' || Array.isArray(action.order)) return null;
        const order = transformCheckoutOrderResponse<CheckoutOrder>(action.order);
        if (!this.isCheckoutOrder(order)) return null;
        return normalizedActionName === 'show_order'
          ? { action: 'show_order', order, message, raw: action }
          : { action: 'pending', order, message, raw: action };
      }
      case 'payment_fail_error':
        return { action: 'payment_fail_error', message, raw: action };
      case 'show_error':
        return { action: 'show_error', message, raw: action };
      case 'fail':
        return { action: 'FAIL', message, raw: action };
      case 'stockviolated':
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
        (item.id === undefined || isPublicId(item.id)) &&
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
        (item.rate.description === undefined || typeof item.rate.description === 'string') &&
        typeof item.rate?.price === 'number' && Number.isFinite(item.rate.price)
      );
  }

  private async callPinchAfterSuccessfulPayment(
    action: PaymentAction,
    paymentId: number,
    options?: RequestOptions,
    traceId?: string
  ): Promise<void> {
    if (action.action !== 'show_order') {
      this.logVerification(traceId, 'pinch_skipped', {
        reason: 'Payment action is not show_order',
        action: action.action
      });
      return;
    }

    if (this.pinchedPayments.has(paymentId)) {
      this.logVerification(traceId, 'pinch_skipped', {
        reason: 'Payment was already pinched',
        paymentId
      });
      return;
    }

    this.pinchedPayments.add(paymentId);
    this.logVerification(traceId, 'pinch_started', {
      method: 'POST',
      endpoint: `${PINCH_API}/order`,
      paymentId
    });
    const pinchResponse = await this.http.post<JsonValue>(`${PINCH_API}/order`, {}, options);
    if (pinchResponse.error) {
      this.pinchedPayments.delete(paymentId);
      this.logVerification(traceId, 'pinch_failed', pinchResponse);
      return;
    }
    this.logVerification(traceId, 'pinch_succeeded', pinchResponse);
  }

  private nextVerificationTraceId(
    operation: 'callback' | 'poll' | 'initialize' | 'status' | 'create'
  ): string {
    this.verificationTraceSequence += 1;
    return `${operation}-${Date.now()}-${this.verificationTraceSequence}`;
  }

  private logVerification(
    traceId: string | undefined,
    stage: string,
    details: unknown
  ): void {
    if (!this.http.isDebugEnabled()) return;
    const redactedDetails = this.redactVerificationLogValue(details);
    let serializedDetails: string;
    try {
      serializedDetails = JSON.stringify(redactedDetails);
    } catch {
      serializedDetails = '"[unserializable payment response]"';
    }
    // Emit one string so browser log collectors preserve the response instead
    // of reducing the second console argument to an uninspectable `Object`.
    console.debug(
      `[Sazito SDK][Payment Verification][${traceId ?? 'untracked'}] ${stage} ${serializedDetails}`
    );
  }

  private redactVerificationLogValue(value: unknown, key = ''): unknown {
    const sensitiveKey = /authorization|cookie|password|secret|token|identifier|tracking|mobile|phone|email|postal|address|first.?name|last.?name|receipt.?ref|ref.?id/i;
    if (sensitiveKey.test(key)) {
      if (value === undefined || value === null || value === '') return value;
      const text = String(value);
      return text.length <= 4 ? '[REDACTED]' : `[REDACTED:${text.slice(-4)}]`;
    }
    if (Array.isArray(value)) {
      return value.map((entry) => this.redactVerificationLogValue(entry));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
          entryKey,
          this.redactVerificationLogValue(entryValue, entryKey)
        ])
      );
    }
    return value;
  }
}
