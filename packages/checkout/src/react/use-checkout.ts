'use client';

import { useSyncExternalStore } from 'react';
import {
  formatMoney,
  formatPrice,
  selectDigitalItems,
  selectSummary,
  strings,
  type CheckoutActions,
  type CheckoutState,
  type CheckoutSummary,
  type InvoiceItem,
  type Strings
} from '../core';
import { useCheckoutEngine } from './context';

export interface UseCheckout {
  state: CheckoutState;
  actions: CheckoutActions;
  /** Localized UI strings. */
  t: Strings;
  /** Format an amount with the currency label for the active locale. */
  money(value: number): string;
  /** Like `money`, but renders 0 as "Free". */
  price(value: number): string;
  summary: CheckoutSummary;
  digitalItems: InvoiceItem[];
}

export function useCheckout(): UseCheckout {
  const engine = useCheckoutEngine();
  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getState,
    engine.getState
  );

  return {
    state,
    actions: engine.actions,
    t: strings(state.locale),
    money: (value: number) => formatMoney(value, state.locale),
    price: (value: number) => formatPrice(value, state.locale),
    summary: selectSummary(state.invoice),
    digitalItems: selectDigitalItems(state.invoice, state.shippingGroups, state.applicable)
  };
}
