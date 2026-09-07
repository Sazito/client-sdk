import type { PaymentMethod } from '@sazito/client-sdk';

const LAST_PAYMENT_METHODS = new Set(['paymentinplace', 'cardtocardpayment']);

/**
 * Put the backend default first, regular online methods next, and manual
 * pay-on-delivery/card-to-card options last. Preserve backend `order` within
 * each group and keep the original order when values tie.
 */
export function sortPaymentMethods(methods: readonly PaymentMethod[]): PaymentMethod[] {
  return methods
    .map((method, index) => ({ method, index }))
    .sort((left, right) => {
      const groupDifference = paymentMethodGroup(left.method) - paymentMethodGroup(right.method);
      if (groupDifference !== 0) return groupDifference;
      const orderDifference = normalizedOrder(left.method.order) - normalizedOrder(right.method.order);
      return orderDifference || left.index - right.index;
    })
    .map(({ method }) => method);
}

function paymentMethodGroup(method: PaymentMethod): number {
  if (method.isDefault) return 0;
  return LAST_PAYMENT_METHODS.has(method.code) ? 2 : 1;
}

function normalizedOrder(order: number): number {
  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
}
