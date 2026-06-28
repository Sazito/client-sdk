/**
 * Typed event bus helpers.
 */
import type { CheckoutEvent, CheckoutEventName, CheckoutStep } from './types';

export function makeEvent(
  name: CheckoutEventName,
  data?: { step?: CheckoutStep; value?: number; metadata?: Record<string, unknown> }
): CheckoutEvent {
  return {
    name,
    step: data?.step,
    value: data?.value,
    metadata: data?.metadata,
    timestamp: Date.now()
  };
}
