import type { PaymentAction, PaymentCredentials } from '@sazito/client-sdk';

export type VerifiedPaymentSuccess = Extract<PaymentAction, { action: 'show_order' }>;

export const VERIFIED_PAYMENT_RESULT_TTL = 5 * 60 * 1000;

export function verifiedPaymentResultKey(payment: PaymentCredentials): string {
  return `sazito:verified-payment:${payment.id}:${payment.identifier}`;
}

/** Consume the server-rendered handoff once, scoped to this tab and payment. */
export function consumeVerifiedPaymentResult(payment: PaymentCredentials): VerifiedPaymentSuccess | undefined {
  try {
    const key = verifiedPaymentResultKey(payment);
    const stored = sessionStorage.getItem(key);
    if (!stored) return undefined;
    sessionStorage.removeItem(key);
    const result = JSON.parse(stored);
    if (
      result?.payment?.id !== payment.id ||
      result?.payment?.identifier !== payment.identifier ||
      typeof result?.expiresAt !== 'number' ||
      result.expiresAt < Date.now() ||
      result?.action?.action !== 'show_order'
    ) return undefined;
    return result.action as VerifiedPaymentSuccess;
  } catch {
    return undefined;
  }
}
