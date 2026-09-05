import { describe, expect, it } from 'vitest';
import {
  parsePaymentReturn,
  parsePaymentReturnUrl
} from '../src/core/payment-return';

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
    ['madeuppaymentresult', 'payment', '304', 'identifier', 'token'],
    ['paymentinplaceresult', 'payment', '304', 'wrong', 'token'],
    ['paymentinplaceresult', 'payment', '304', 'identifier', 'token', 'extra']
  ])('rejects a non-callback path: %j', (segments) => {
    expect(parsePaymentReturn(segments)).toBeUndefined();
  });

  it('parses a callback suffix from a complete checkout URL', () => {
    expect(parsePaymentReturnUrl(
      'https://shop.example.com/store/checkout/paymentinplaceresult/payment/308/identifier/callback%2Dtoken?code=ok&code=ignored'
    )).toEqual({
      payment: {
        id: 308,
        identifier: 'callback-token'
      },
      params: {
        code: 'ok',
        id: '308',
        paymentIdentifier: 'callback-token'
      }
    });
  });

  it('rejects an ordinary complete checkout URL', () => {
    expect(parsePaymentReturnUrl('/checkout')).toBeUndefined();
  });

  it('allows a host-configured result marker', () => {
    expect(parsePaymentReturn(
      ['custompaymentresult', 'payment', '304', 'identifier', 'token'],
      {},
      { gatewayResultMarkers: ['custompaymentresult'] }
    )?.payment).toEqual({ id: 304, identifier: 'token' });
  });
});
