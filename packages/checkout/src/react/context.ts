'use client';

import { createContext, useContext } from 'react';
import type { CheckoutEngine } from '../core';

export const CheckoutEngineContext = createContext<CheckoutEngine | null>(null);

export function useCheckoutEngine(): CheckoutEngine {
  const engine = useContext(CheckoutEngineContext);
  if (!engine) {
    throw new Error('useCheckout must be used within <CheckoutProvider>.');
  }
  return engine;
}
