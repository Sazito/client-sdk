import { describe, expect, it } from 'vitest';
import { fromSdkError } from '../src/core/errors';

describe('checkout error mapping', () => {
  it('maps a missing cart response to the empty-cart state code', () => {
    expect(
      fromSdkError(
        { message: 'No cart found. Please create a cart first.', type: 'api', status: 404 },
        'en',
        'cart'
      ).code
    ).toBe('no_cart');
  });

  it('maps the client-side missing-credentials response to the empty-cart state code', () => {
    expect(
      fromSdkError(
        { message: 'No cart found. Please create a cart first.', type: 'validation' },
        'en',
        'cart'
      ).code
    ).toBe('no_cart');
  });

  it('keeps a cart network failure fatal', () => {
    expect(
      fromSdkError({ message: 'Request timeout', type: 'network' }, 'en', 'cart').code
    ).toBe('network');
  });
});
