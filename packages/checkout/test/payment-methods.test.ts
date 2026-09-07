import { describe, expect, it } from 'vitest';
import type { PaymentMethod } from '@sazito/client-sdk';
import { sortPaymentMethods } from '../src/core/payment-methods';

function method(
  id: number,
  code: PaymentMethod['code'],
  order: number,
  isDefault = false
): PaymentMethod {
  return {
    id,
    code,
    order,
    isDefault,
    title: code,
    titleFa: code,
    description: null,
    paymentSubType: null
  };
}

describe('payment method ordering', () => {
  it('shows default first, online methods next, and manual methods last', () => {
    const methods = [
      method(1, 'cardtocardpayment', 1),
      method(2, 'paymentinplace', 2),
      method(3, 'zibalpayment', 4),
      method(4, 'mellatpayment', 3),
      method(5, 'paymentinplace', 99, true)
    ];

    expect(sortPaymentMethods(methods).map(({ id }) => id)).toEqual([5, 4, 3, 1, 2]);
    expect(methods.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps backend order and stable ties inside a group', () => {
    const methods = [
      method(1, 'zibalpayment', 2),
      method(2, 'mellatpayment', 1),
      method(3, 'pecpayment', 1)
    ];
    expect(sortPaymentMethods(methods).map(({ id }) => id)).toEqual([2, 3, 1]);
  });
});
