'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSazitoClient } from '@sazito/client-sdk';
import { SazitoProvider, SazitoCheckoutPage } from '@sazito/checkout/next';

const SAZITO_API_ORIGIN = 'http://api.sazito.com:8080';

type MockPaymentScenario =
  | 'live'
  | 'success-minimal'
  | 'success-full'
  | 'pending-success'
  | 'failure'
  | 'malformed';

const MOCK_PAYMENT_ID = 789;
const MOCK_PAYMENT_IDENTIFIER = 'mock-payment-identifier';

const MOCK_ORDER_BASE = {
  id: 1001,
  order_number: 'MOCK-10001',
  order_identifier: 'mock-order-identifier',
  invoice: {
    invoice_items: [],
    shipping_items: [],
  },
};

function createDemoFetch(mockPayment: MockPaymentScenario): typeof fetch {
  return async (input, init) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    if (mockPayment !== 'live' && url.includes('/process_payment_step')) {
      const headers = new Headers(init?.headers);
      const contentType = headers.get('content-type') ?? '';
      const isStatusPoll = contentType.startsWith('application/json');

      if (!isStatusPoll) {
        const form = new URLSearchParams(String(init?.body ?? ''));
        const hasValidContract =
          contentType.startsWith('application/x-www-form-urlencoded') &&
          form.get('payment_identifier') === MOCK_PAYMENT_IDENTIFIER &&
          form.get('payload[RefId]') === 'mock-bank-reference';

        if (!hasValidContract) {
          return jsonResponse({
            error: 'Mock callback expected URL-encoded payload[fieldName] values.',
            error_code: 400,
            status: 400,
          }, 400);
        }
      }

      return jsonResponse({ result: mockPaymentResult(mockPayment, isStatusPoll) });
    }

    // Successful verification invokes the existing idempotent pinch hook.
    if (mockPayment !== 'live' && url.includes('/api/v1/pinch/order')) {
      return jsonResponse({ result: true });
    }

    if (!url.startsWith(SAZITO_API_ORIGIN)) {
      return fetch(input, init);
    }

    const headers = new Headers(init?.headers);
    const shopDomain = headers.get('x-forwarded-host');

    if (shopDomain) {
      headers.set('x-sazito-shop-domain', shopDomain);
      headers.delete('x-forwarded-host');
    }

    return fetch(url.replace(SAZITO_API_ORIGIN, '/sazito-api'), {
      ...init,
      headers,
    });
  };
}

function mockPaymentResult(scenario: MockPaymentScenario, isStatusPoll: boolean) {
  switch (scenario) {
    case 'success-minimal':
      return { action: 'show_order', order: MOCK_ORDER_BASE };
    case 'success-full':
      return {
        action: 'show_order',
        order: {
          ...MOCK_ORDER_BASE,
          invoice: {
            ...MOCK_ORDER_BASE.invoice,
            net_total: 1250000,
            final_total: 1290000,
            shipping_total: 40000,
            vat: 0,
          },
        },
      };
    case 'pending-success':
      return isStatusPoll
        ? { action: 'show_order', order: MOCK_ORDER_BASE }
        : { action: 'pending', order: MOCK_ORDER_BASE };
    case 'failure':
      return { action: 'payment_fail_error', message: 'Mock payment verification failed.' };
    case 'malformed':
      return {
        action: 'show_order',
        order: { id: 1001, invoice: { invoice_items: [], shipping_items: [] } },
      };
    case 'live':
      return { action: 'payment_fail_error', message: 'Mock mode is disabled.' };
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const DEFAULT_DOMAIN = 'noel-accessories.ir';
const DEFAULT_CART_IDENTIFIER = '019f1879-bcbe-7bdf-b50a-fec3ca7f0b9d';
const SETTINGS_STORAGE_KEY = 'sazito-checkout-demo-settings';

interface DemoSettings {
  domain: string;
  cartIdentifier: string;
  mockPayment: MockPaymentScenario;
}

const MOCK_PAYMENT_SCENARIOS = new Set<MockPaymentScenario>([
  'live',
  'success-minimal',
  'success-full',
  'pending-success',
  'failure',
  'malformed',
]);

function readMockPaymentScenario(value: string | null | undefined): MockPaymentScenario {
  return value && MOCK_PAYMENT_SCENARIOS.has(value as MockPaymentScenario)
    ? value as MockPaymentScenario
    : 'live';
}

function readInitialSettings(): DemoSettings {
  const params = new URLSearchParams(window.location.search);

  let saved: Partial<DemoSettings> = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
  } catch {
    // ignore corrupted storage
  }

  return {
    domain: params.get('domain') || saved.domain || DEFAULT_DOMAIN,
    cartIdentifier: params.get('cart') || saved.cartIdentifier || DEFAULT_CART_IDENTIFIER,
    mockPayment: readMockPaymentScenario(params.get('mockPayment') || saved.mockPayment),
  };
}

function persistSettings(settings: DemoSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  const url = new URL(window.location.href);
  url.searchParams.set('domain', settings.domain);
  url.searchParams.set('cart', settings.cartIdentifier);
  if (settings.mockPayment === 'live') {
    url.searchParams.delete('mockPayment');
  } else {
    url.searchParams.set('mockPayment', settings.mockPayment);
  }
  window.history.replaceState(null, '', url.toString());
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'monospace',
  direction: 'ltr',
  minWidth: 280,
};

function DemoSettingsBar({
  settings,
  onApply,
}: {
  settings: DemoSettings;
  onApply: (settings: DemoSettings) => void;
}) {
  const [domain, setDomain] = useState(settings.domain);
  const [cartIdentifier, setCartIdentifier] = useState(settings.cartIdentifier);
  const [mockPayment, setMockPayment] = useState(settings.mockPayment);

  const dirty =
    domain.trim() !== settings.domain ||
    cartIdentifier.trim() !== settings.cartIdentifier ||
    mockPayment !== settings.mockPayment;
  const valid = Boolean(domain.trim()) && (mockPayment !== 'live' || Boolean(cartIdentifier.trim()));

  return (
    <form
      dir="ltr"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({ domain: domain.trim(), cartIdentifier: cartIdentifier.trim(), mockPayment });
      }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        Domain
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder={DEFAULT_DOMAIN}
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        Cart identifier
        <input
          value={cartIdentifier}
          onChange={(event) => setCartIdentifier(event.target.value)}
          placeholder={DEFAULT_CART_IDENTIFIER}
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        Payment result
        <select
          value={mockPayment}
          onChange={(event) => setMockPayment(event.target.value as MockPaymentScenario)}
          style={inputStyle}
        >
          <option value="live">Live checkout</option>
          <option value="success-minimal">Mock: success without totals</option>
          <option value="success-full">Mock: success with totals</option>
          <option value="pending-success">Mock: pending → success</option>
          <option value="failure">Mock: payment failure</option>
          <option value="malformed">Mock: malformed order</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={!dirty || !valid}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: 'none',
          background: dirty && valid ? '#4f46e5' : '#cbd5e1',
          color: '#fff',
          fontSize: 14,
          cursor: dirty && valid ? 'pointer' : 'default',
        }}
      >
        Apply
      </button>
    </form>
  );
}

export default function CheckoutDemoPage() {
  const [settings, setSettings] = useState<DemoSettings | null>(null);

  useEffect(() => {
    setSettings(readInitialSettings());
  }, []);

  const sazito = useMemo(
    () =>
      settings
        ? createSazitoClient({
            domain: settings.domain,
            customFetchApi: createDemoFetch(settings.mockPayment),
          })
        : null,
    [settings?.domain, settings?.mockPayment],
  );

  if (!settings || !sazito) {
    return null;
  }

  return (
    <>
      <DemoSettingsBar
        key={`${settings.domain}:${settings.cartIdentifier}:${settings.mockPayment}`}
        settings={settings}
        onApply={(next) => {
          persistSettings(next);
          setSettings(next);
        }}
      />
      <SazitoProvider client={sazito}>
        <SazitoCheckoutPage
          key={`${settings.domain}:${settings.cartIdentifier}:${settings.mockPayment}`}
          credentials={settings.mockPayment === 'live'
            ? { cart: { identifier: settings.cartIdentifier } }
            : undefined}
          paymentReturn={settings.mockPayment === 'live' ? undefined : {
            payment: { id: MOCK_PAYMENT_ID, identifier: MOCK_PAYMENT_IDENTIFIER },
            params: {
              id: String(MOCK_PAYMENT_ID),
              paymentIdentifier: MOCK_PAYMENT_IDENTIFIER,
              RefId: 'mock-bank-reference',
              ResCode: '0',
            },
          }}
          config={{
            locale: 'fa',
            continueShoppingUrl: '/',
            pollIntervalMs: settings.mockPayment === 'pending-success' ? 250 : 15000,
            theme: { accent: '#4f46e5', radius: 16, fontFamily: 'var(--font-vazirmatn), sans-serif' },
          }}
        />
      </SazitoProvider>
    </>
  );
}
