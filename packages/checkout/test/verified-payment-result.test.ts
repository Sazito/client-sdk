import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '@sazito/client-sdk';
import { consumeVerifiedPaymentResult, verifiedPaymentResultKey } from '../src/core/verified-payment-result';

const payment = { id: 304, identifier: 'test-payment' };

afterEach(() => vi.unstubAllGlobals());

describe('verified payment handoff', () => {
  it('preserves order details and consumes the result once', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('sessionStorage', storage);
    const action = { action: 'show_order', order: { id: 12, orderNumber: 'OR12' } };
    storage.setItem(verifiedPaymentResultKey(payment), JSON.stringify({
      payment, action, expiresAt: Date.now() + 60000
    }));
    expect(consumeVerifiedPaymentResult(payment)).toEqual(action);
    expect(consumeVerifiedPaymentResult(payment)).toBeUndefined();
  });

  it.each([
    { payment: { id: 999, identifier: 'other' }, action: { action: 'show_order' }, expiresAt: Date.now() + 60000 },
    { payment, action: { action: 'show_order' }, expiresAt: 0 },
    { payment, action: { action: 'FAIL' }, expiresAt: Date.now() + 60000 },
    null
  ])('rejects missing, stale, or mismatched confirmation: %j', (value) => {
    const storage = new MemoryStorage();
    vi.stubGlobal('sessionStorage', storage);
    storage.setItem(verifiedPaymentResultKey(payment), JSON.stringify(value));
    expect(consumeVerifiedPaymentResult(payment)).toBeUndefined();
  });
});
