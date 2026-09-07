import { describe, expect, it } from 'vitest';
import { strings } from '../src/core/labels';

describe('checkout labels', () => {
  it('uses a payment action for the final checkout button', () => {
    expect(strings('fa').finishPurchase).toBe('انجام پرداخت');
    expect(strings('en').finishPurchase).toBe('Pay now');
  });
});
