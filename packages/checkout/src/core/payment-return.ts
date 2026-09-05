import type {
  CheckoutPaymentReturn,
  PaymentReturnParserOptions,
  PaymentReturnSearchParams
} from './types';

export const SAZITO_PAYMENT_RESULT_MARKERS = [
  'mellatpaymentresult', 'pecpaymentresult', 'uppaymentresult',
  'seppaymentresult', 'vandarpaymentresult', 'yourgatepaymentresult',
  'bazarpaymentresult', 'zifypaymentresult', 'zibalpaymentresult',
  'snapppaypaymentresult', 'torobpaypaymentresult', 'ghestapaypaymentresult',
  'azkipaymentresult', 'digipaypaymentresult', 'greenpaypaymentresult',
  'novapaypaymentresult', 'zarinpluspaymentresult', 'tomanpaymentresult',
  'tarapaymentresult', 'ozonpaymentresult', 'millipaypaymentresult',
  'ayriapaymentresult', 'sadadpaymentresult', 'freepaymentresult',
  'paymentinplaceresult', 'cardtocardpaymentresult', 'zarinpalpaymentresult',
  'directpayresult', 'paypingpaymentresult', 'podpaymentresult',
  'sabinpaymentresult', 'firoozepaymentresult', 'technopaypaymentresult',
  'buywithdigikalaresult'
] as const;

/**
 * Parse Sazito's nested payment callback path into checkout-ready data.
 * Returns undefined for ordinary checkout URLs and malformed callbacks.
 */
export function parsePaymentReturn(
  segments: readonly string[] | undefined,
  searchParams: PaymentReturnSearchParams = {},
  options: PaymentReturnParserOptions = {}
): CheckoutPaymentReturn | undefined {
  const [resultRoute, paymentSegment, rawPaymentId, identifierSegment, rawIdentifier] =
    segments ?? [];
  const paymentId = Number(rawPaymentId);
  const identifier = rawIdentifier?.trim();
  const allowedMarkers = new Set(
    (options.gatewayResultMarkers ?? SAZITO_PAYMENT_RESULT_MARKERS)
      .map((marker) => marker.toLowerCase())
  );

  if (
    segments?.length !== 5 ||
    !resultRoute ||
    !allowedMarkers.has(resultRoute.toLowerCase()) ||
    paymentSegment?.toLowerCase() !== 'payment' ||
    identifierSegment?.toLowerCase() !== 'identifier' ||
    !Number.isSafeInteger(paymentId) ||
    paymentId <= 0 ||
    !identifier
  ) {
    return undefined;
  }

  const params = normalizeSearchParams(searchParams);
  params.id = String(paymentId);
  params.paymentIdentifier = identifier;

  return {
    payment: { id: paymentId, identifier },
    params
  };
}

/**
 * Parse a complete checkout URL containing Sazito's nested payment callback.
 * The callback may be mounted below any checkout base path; only its final
 * five path segments are significant.
 */
export function parsePaymentReturnUrl(
  url: string | URL,
  options: PaymentReturnParserOptions = {}
): CheckoutPaymentReturn | undefined {
  let parsedUrl: URL;

  try {
    parsedUrl = typeof url === 'string'
      ? new URL(url, 'https://checkout.sazito.invalid')
      : url;
  } catch {
    return undefined;
  }

  const segments = parsedUrl.pathname
    .split('/')
    .filter(Boolean)
    .map(decodePathSegment);

  if (segments.length < 5) {
    return undefined;
  }

  const searchParams: Record<string, string> = {};
  for (const [key, value] of parsedUrl.searchParams) {
    // Match Next.js search-param normalization: preserve the first value.
    if (searchParams[key] === undefined) {
      searchParams[key] = value;
    }
  }

  return parsePaymentReturn(segments.slice(-5), searchParams, options);
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function normalizeSearchParams(
  searchParams: PaymentReturnSearchParams
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue !== undefined) {
      normalized[key] = firstValue;
    }
  }

  return normalized;
}
