// @vitest-environment jsdom

import { act, createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSazitoClient, MemoryStorage } from '@sazito/client-sdk';
import { CheckoutProvider } from '../src/react/provider';
import { SazitoProvider } from '../src/react/client-context';
import { useCheckout } from '../src/react/use-checkout';
import { SazitoCheckoutPage } from '../src/next/SazitoCheckoutPage';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('localStorage', new MemoryStorage());
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function ResultProbe() {
  const { state } = useCheckout();
  return createElement('output', null, `${state.step}:${state.result?.status ?? 'none'}`);
}

describe.each([
  ['provider', 'show_order', 'success'],
  ['provider', 'payment_fail_error', 'failed'],
  ['page', 'show_order', 'success'],
  ['page', 'payment_fail_error', 'failed']
] as const)('%s payment return lifecycle (%s)', (composition, backendAction, expectedStatus) => {
  it.each(['callback', 'status'] as const)(
    'keeps the %s result through URL cleanup, Strict Mode, and host rerenders',
    async (resolution) => {
      window.history.replaceState({}, '', `/checkout?lang=fa&sazito_payment_return=${resolution}&sazito_payment_id=304&sazito_payment_identifier=test-payment`);
      let completeVerification!: () => void;
      const verificationReady = new Promise<void>((resolve) => { completeVerification = resolve; });
      const requests: string[] = [];
      const client = createSazitoClient({
        domain: 'shop.example.com',
        customFetchApi: async (input) => {
          const url = String(input);
          requests.push(url);
          if (url.includes('/process_payment_step')) {
            await verificationReady;
            const calls = requests.filter((request) => request.includes('/process_payment_step'));
            return new Response(JSON.stringify({ result: {
              action: calls.length === 1 ? backendAction : 'payment_fail_error'
            } }), { headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ result: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      });
      const cartGet = vi.spyOn(client.cart, 'get');
      const renderHost = () => root.render(createElement(StrictMode, null,
        createElement(SazitoProvider, { client, children: composition === 'provider'
          ? createElement(CheckoutProvider, null, createElement(ResultProbe))
          : createElement(SazitoCheckoutPage, {
              renderResult: ({ status }) => createElement('output', null, `result:${status}`)
            }) })));

      await act(async () => renderHost());
      expect(window.location.search).toBe('?lang=fa');
      // CommerceProvider refreshCart/syncCart causes this parent render after
      // replaceState has removed the callback credentials from the URL.
      await act(async () => renderHost());
      await act(async () => completeVerification());
      await act(async () => renderHost());

      expect(container.textContent).toContain(`result:${expectedStatus}`);
      expect(requests.filter((url) => url.includes('/process_payment_step'))).toHaveLength(1);
      expect(requests.every((url) => /process_payment_step|pinch\/order/.test(url))).toBe(true);
      expect(cartGet).not.toHaveBeenCalled();
    }
  );
});
