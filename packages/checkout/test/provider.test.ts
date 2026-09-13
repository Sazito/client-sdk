// @vitest-environment jsdom

import { act, createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSazitoClient, MemoryStorage } from '@sazito/client-sdk';
import { CheckoutProvider } from '../src/react/provider';
import { SazitoProvider } from '../src/react/client-context';
import { useCheckout } from '../src/react/use-checkout';
import { SazitoCheckoutPage, type SazitoCheckoutPageProps } from '../src/next/SazitoCheckoutPage';
import { SazitoCheckout as createCheckoutHandlers } from '../src/server';
import { verifiedPaymentResultKey } from '../src/core/verified-payment-result';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('sessionStorage', new MemoryStorage());
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

it('does not infer success from a result URL without a server-provided confirmation', async () => {
  window.history.replaceState({}, '', '/checkout?sazito_payment_return=result&sazito_payment_id=304&sazito_payment_identifier=test-payment');
  const customFetchApi = vi.fn(async () => Response.json({ result: { action: 'show_order' } }));
  const client = createSazitoClient({ domain: 'shop.example.com', customFetchApi });
  await act(async () => root.render(createElement(CheckoutProvider, {
    client, children: createElement(ResultProbe)
  })));
  expect(container.textContent).not.toContain('success');
  expect(customFetchApi).not.toHaveBeenCalled();
});

it.each([
  { name: 'default route', expected: '/orderinfo/290/token%2B%2F%26%3F%3D%23' },
  { name: 'default route on the storefront host', continueShoppingUrl: 'https://store.example.com/products', expected: 'https://store.example.com/orderinfo/290/token%2B%2F%26%3F%3D%23' },
  { name: 'theme route', customBase: '/fa/account/orders', expected: '/fa/account/orders/290?identifier=token%2B%2F%26%3F%3D%23' },
  { name: 'theme host and route', customBase: 'https://theme.example.com/shop/orders', continueShoppingUrl: 'https://store.example.com/products', expected: 'https://theme.example.com/shop/orders/290?identifier=token%2B%2F%26%3F%3D%23' },
  { name: 'hidden link', hide: true, expected: null }
])('uses $name for order details after a confirmed payment', async ({ customBase, continueShoppingUrl, hide, expected }) => {
  const payment = { id: 304, identifier: 'test-payment' };
  const order = {
    id: 290,
    orderNumber: 'OR290',
    orderIdentifier: 'token+/&?=#',
    invoice: { invoiceItems: [], shippingItems: [] }
  };
  sessionStorage.setItem(verifiedPaymentResultKey(payment), JSON.stringify({
    payment,
    action: {
      action: 'show_order',
      order: {
        ...order,
        invoice: { invoiceItems: [], shippingItems: [] }
      }
    },
    expiresAt: Date.now() + 60000
  }));
  window.history.replaceState({}, '', '/checkout?sazito_payment_return=result&sazito_payment_id=304&sazito_payment_identifier=test-payment');
  const client = createSazitoClient({
    domain: 'shop.example.com',
    customFetchApi: vi.fn(async () => Response.json({ result: true }))
  });
  const getOrderDetailsUrl = vi.fn<NonNullable<SazitoCheckoutPageProps['getOrderDetailsUrl']>>((value) => hide
    ? null
    : `${customBase}/${encodeURIComponent(String(value.id))}?identifier=${encodeURIComponent(value.orderIdentifier)}`);

  await act(async () => root.render(createElement(SazitoProvider, {
    client,
    children: createElement(SazitoCheckoutPage, {
      config: { locale: 'fa', continueShoppingUrl },
      getOrderDetailsUrl: customBase || hide ? getOrderDetailsUrl : undefined
    })
  })));

  const link = container.querySelector<HTMLAnchorElement>('a[target="_blank"]');
  if (customBase || hide) expect(getOrderDetailsUrl).toHaveBeenCalledWith(order);
  if (expected === null) {
    expect(link).toBeNull();
    return;
  }
  expect(link?.getAttribute('href')).toBe(expected);
  expect(link?.textContent).toBe('جزئیات سفارش');
  expect(link?.target).toBe('_blank');
  expect(link?.rel).toBe('noopener noreferrer');
});

it.each(['cardtocardpaymentresult', 'zibalpaymentresult', 'paymentinplaceresult'])(
  'renders server show_order for %s without verifying an already finalized payment again',
  async (marker) => {
    let verificationCalls = 0;
    const customFetchApi = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/process_payment_step')) {
        verificationCalls += 1;
        return Response.json({ result: {
          action: verificationCalls === 1 ? 'show_order' : 'payment_fail_error',
          order: null
        } });
      }
      return Response.json({ result: true });
    });
    const config = { domain: 'shop.example.com', customFetchApi };
    const { handlers } = createCheckoutHandlers(config);
    const response = await handlers.POST(new Request(
      `http://localhost:3000/checkout/${marker}/payment/304/identifier/test-payment`,
      { method: 'POST', body: 'code=ok' }
    ));
    let nextUrl = response.headers.get('location');
    if (response.headers.get('content-type')?.includes('text/html')) {
      const html = await response.text();
      const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];
      expect(script).toBeDefined();
      // Execute our server-generated bridge with browser storage and a
      // captured navigation, then mount the real checkout at its destination.
      new Function('sessionStorage', 'location', script!)(sessionStorage, {
        replace: (url: string) => { nextUrl = url; }
      });
    }
    expect(nextUrl).toBeTruthy();
    const destination = new URL(nextUrl!);
    window.history.replaceState({}, '', destination.pathname + destination.search);
    const client = createSazitoClient(config);
    const renderHost = () => root.render(createElement(StrictMode, null,
      createElement(CheckoutProvider, { client, children: createElement(ResultProbe) })));
    await act(async () => renderHost());
    await act(async () => renderHost());

    expect(container.textContent).toBe('result:success');
    expect(verificationCalls).toBe(1);
    expect(client.getCredentialsManager().getPaymentCredentials()).toBeNull();
  }
);

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
