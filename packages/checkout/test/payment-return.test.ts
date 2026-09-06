import { describe, expect, it } from 'vitest';
import {
  parsePaymentReturn,
  parsePaymentReturnUrl,
  stripPaymentStatusReturn
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

  it('parses a server-verified status return without gateway callback fields', () => {
    expect(parsePaymentReturnUrl(
      'https://shop.example.com/checkout?sazito_payment_return=status&sazito_payment_id=308&sazito_payment_identifier=callback-token'
    )).toEqual({
      payment: { id: 308, identifier: 'callback-token' },
      params: { id: '308', paymentIdentifier: 'callback-token' },
      resolution: 'status'
    });
  });

  it('parses a browser-finalized payment-in-place return', () => {
    expect(parsePaymentReturnUrl(
      'https://shop.example.com/checkout?sazito_payment_return=callback&sazito_payment_id=308&sazito_payment_identifier=callback-token'
    )).toEqual({
      payment: { id: 308, identifier: 'callback-token' },
      params: { id: '308', paymentIdentifier: 'callback-token' },
      resolution: 'callback'
    });
  });

  it('rejects malformed server status returns', () => {
    expect(parsePaymentReturnUrl(
      'https://shop.example.com/checkout?sazito_payment_return=status&sazito_payment_id=0&sazito_payment_identifier=token'
    )).toBeUndefined();
  });

  it('removes server-return credentials while preserving other URL state', () => {
    expect(stripPaymentStatusReturn(
      'https://shop.example.com/checkout?lang=fa&sazito_payment_return=status&sazito_payment_id=308&sazito_payment_identifier=token#result'
    )).toBe('/checkout?lang=fa#result');
  });

  it('removes browser-finalized return credentials from the visible URL', () => {
    expect(stripPaymentStatusReturn(
      'https://shop.example.com/checkout?lang=fa&sazito_payment_return=callback&sazito_payment_id=308&sazito_payment_identifier=token#result'
    )).toBe('/checkout?lang=fa#result');
  });

  it('allows a host-configured result marker', () => {
    expect(parsePaymentReturn(
      ['custompaymentresult', 'payment', '304', 'identifier', 'token'],
      {},
      { gatewayResultMarkers: ['custompaymentresult'] }
    )?.payment).toEqual({ id: 304, identifier: 'token' });
  });
});
