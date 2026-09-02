import type {
  CheckoutPaymentReturn,
  PaymentReturnSearchParams
} from './types';

/**
 * Parse Sazito's nested payment callback path into checkout-ready data.
 * Returns undefined for ordinary checkout URLs and malformed callbacks.
 */
export function parsePaymentReturn(
  segments: readonly string[] | undefined,
  searchParams: PaymentReturnSearchParams = {}
): CheckoutPaymentReturn | undefined {
  const [resultRoute, paymentSegment, rawPaymentId, identifierSegment, rawIdentifier] =
    segments ?? [];
  const paymentId = Number(rawPaymentId);
  const identifier = rawIdentifier?.trim();

  if (
    segments?.length !== 5 ||
    !resultRoute?.toLowerCase().endsWith('result') ||
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
