import { describe, expect, it } from 'vitest';
import { parsePaymentReturn } from '../src/core/payment-return';

describe('parsePaymentReturn', () => {
  it('parses a nested Sazito callback and preserves query parameters', () => {
    expect(parsePaymentReturn(
      [
        'paymentinplaceresult',
        'payment',
        '304',
        'identifier',
        '6f8a717eb211f0839e522a5358932968'
      ],
      { code: 'ok', repeated: ['first', 'second'], empty: undefined }
    )).toEqual({
      payment: {
        id: 304,
        identifier: '6f8a717eb211f0839e522a5358932968'
      },
      params: {
        code: 'ok',
        repeated: 'first',
        id: '304',
        paymentIdentifier: '6f8a717eb211f0839e522a5358932968'
      }
    });
  });

  it.each([
    undefined,
    [],
    ['paymentinplaceresult'],
    ['paymentinplaceresult', 'payment', 'not-a-number', 'identifier', 'token'],
    ['paymentinplaceresult', 'payment', '304', 'wrong', 'token'],
    ['paymentinplaceresult', 'payment', '304', 'identifier', 'token', 'extra']
  ])('rejects a non-callback path: %j', (segments) => {
    expect(parsePaymentReturn(segments)).toBeUndefined();
  });
});
