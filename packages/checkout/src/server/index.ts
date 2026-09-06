/**
 * @sazito/checkout/server — server-only payment callback handlers.
 *
 * The implementation uses only the standard Web Request/Response APIs so the
 * same handlers work in Next.js Route Handlers and other compatible runtimes.
 */
import {
  createSazitoClient,
  type PaymentCallbackFieldValue,
  type PaymentCallbackFields,
  type SazitoConfig
} from '@sazito/client-sdk';
import {
  parsePaymentReturnUrl,
  SAZITO_PAYMENT_STATUS_QUERY
} from '../core/payment-return';
import type { PaymentReturnParserOptions } from '../core/types';

const DEFAULT_CHECKOUT_PATH = '/checkout';
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export type SazitoPaymentRouteHandler = (request: Request) => Promise<Response>;

export interface SazitoCheckoutServerConfig extends SazitoConfig {
  /** Page that renders `SazitoCheckoutPage` after server verification. */
  checkoutPath?: string;
  /** Maximum accepted gateway callback body size. Defaults to 64 KiB. */
  maxCallbackBodyBytes?: number;
  /** Replace the built-in gateway-result marker allowlist. */
  gatewayResultMarkers?: readonly string[];
}

export interface SazitoCheckoutServer {
  handlers: {
    GET: SazitoPaymentRouteHandler;
    POST: SazitoPaymentRouteHandler;
  };
}

/**
 * Create GET and POST route handlers for payment callbacks.
 * A fresh SDK client is created for each request so server-side guest
 * credentials can never leak between concurrent callbacks.
 */
export function SazitoCheckout(config: SazitoCheckoutServerConfig): SazitoCheckoutServer {
  const {
    checkoutPath = DEFAULT_CHECKOUT_PATH,
    maxCallbackBodyBytes = DEFAULT_MAX_BODY_BYTES,
    gatewayResultMarkers,
    ...sdkConfig
  } = config;

  validateConfig(sdkConfig, checkoutPath, maxCallbackBodyBytes);
  const parserOptions: PaymentReturnParserOptions = { gatewayResultMarkers };

  const createHandler = (method: 'GET' | 'POST'): SazitoPaymentRouteHandler =>
    async (request) => {
      if (request.method.toUpperCase() !== method) {
        return errorResponse(405, 'method_not_allowed', { Allow: method });
      }

      try {
        const callback = parsePaymentReturnUrl(request.url, parserOptions);
        if (!callback || callback.resolution === 'status') {
          return errorResponse(400, 'invalid_payment_callback');
        }

        const requestUrl = new URL(request.url);
        const body = method === 'POST'
          ? await readCallbackBody(request, maxCallbackBodyBytes)
          : undefined;
        const query = fieldsFromSearchParams(requestUrl.searchParams);
        const client = createSazitoClient(sdkConfig);
        const verification = await client.payments.verifyPaymentCallback({
          paymentId: callback.payment.id,
          paymentIdentifier: callback.payment.identifier,
          body,
          query
        });

        if (verification.error || !verification.data) {
          if (sdkConfig.debug) {
            console.error('[Sazito Checkout] Payment callback verification failed:', {
              paymentId: callback.payment.id,
              error: verification.error
            });
          }
          return errorResponse(502, 'payment_verification_failed');
        }

        const redirectUrl = createStatusRedirectUrl(
          requestUrl,
          checkoutPath,
          callback.payment
        );
        return new Response(null, {
          status: 303,
          headers: {
            Location: redirectUrl.toString(),
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer'
          }
        });
      } catch (error) {
        if (config.debug) {
          console.error('[Sazito Checkout] Invalid payment callback request:', error);
        }
        const status = error instanceof CallbackRequestError ? error.status : 500;
        const code = error instanceof CallbackRequestError
          ? error.code
          : 'payment_callback_failed';
        return errorResponse(status, code);
      }
    };

  return {
    handlers: {
      GET: createHandler('GET'),
      POST: createHandler('POST')
    }
  };
}

function validateConfig(
  config: SazitoConfig,
  checkoutPath: string,
  maxCallbackBodyBytes: number
): void {
  if (!config.domain?.trim()) {
    throw new Error('[@sazito/checkout] `domain` is required by the payment callback handler.');
  }
  if (!checkoutPath.trim()) {
    throw new Error('[@sazito/checkout] `checkoutPath` cannot be empty.');
  }
  if (!Number.isSafeInteger(maxCallbackBodyBytes) || maxCallbackBodyBytes <= 0) {
    throw new Error('[@sazito/checkout] `maxCallbackBodyBytes` must be a positive integer.');
  }
}

async function readCallbackBody(
  request: Request,
  maxBodyBytes: number
): Promise<PaymentCallbackFields> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    throw new CallbackRequestError(413, 'payment_callback_too_large');
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBodyBytes) {
    throw new CallbackRequestError(413, 'payment_callback_too_large');
  }
  if (bytes.byteLength === 0) return {};

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    return fieldsFromJson(new TextDecoder().decode(bytes));
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await new Response(bytes, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' }
    }).formData();
    return fieldsFromFormData(form);
  }

  // Gateways commonly omit Content-Type or label URL-encoded data as text.
  return fieldsFromSearchParams(new URLSearchParams(new TextDecoder().decode(bytes)));
}

function fieldsFromJson(source: string): PaymentCallbackFields {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new CallbackRequestError(400, 'invalid_payment_callback_body');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CallbackRequestError(400, 'invalid_payment_callback_body');
  }
  return value as PaymentCallbackFields;
}

function fieldsFromSearchParams(params: URLSearchParams): PaymentCallbackFields {
  const fields: PaymentCallbackFields = {};
  for (const [name, value] of params) appendField(fields, name, value);
  return fields;
}

function fieldsFromFormData(form: FormData): PaymentCallbackFields {
  const fields: PaymentCallbackFields = {};
  for (const [name, value] of form) {
    if (typeof value !== 'string') {
      throw new CallbackRequestError(400, 'unsupported_payment_callback_file');
    }
    appendField(fields, name, value);
  }
  return fields;
}

function appendField(
  fields: PaymentCallbackFields,
  name: string,
  value: PaymentCallbackFieldValue
): void {
  const current = fields[name];
  if (current === undefined) {
    fields[name] = value;
  } else if (Array.isArray(current)) {
    fields[name] = [...current, value ?? null];
  } else {
    fields[name] = [current, value ?? null];
  }
}

function createStatusRedirectUrl(
  requestUrl: URL,
  checkoutPath: string,
  payment: { id: number; identifier: string }
): URL {
  const redirectUrl = new URL(checkoutPath, requestUrl.origin);
  redirectUrl.searchParams.set(SAZITO_PAYMENT_STATUS_QUERY.resolution, 'status');
  redirectUrl.searchParams.set(SAZITO_PAYMENT_STATUS_QUERY.paymentId, String(payment.id));
  redirectUrl.searchParams.set(
    SAZITO_PAYMENT_STATUS_QUERY.paymentIdentifier,
    payment.identifier
  );
  return redirectUrl;
}

function errorResponse(
  status: number,
  code: string,
  extraHeaders: Record<string, string> = {}
): Response {
  return Response.json(
    { error: code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...extraHeaders
      }
    }
  );
}

class CallbackRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}
