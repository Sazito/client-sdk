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

// Sanitized from a real payment-in-place `show_order` response captured from
// the v2 API. Keep backend key names and nullable/empty fields intact so the
// demo exercises the production response transformer rather than a UI-shaped
// fixture.
const MOCK_CAPTURED_SUCCESS_ORDER = {
  id: 270,
  order_number: 'MOCK-OR0000000270',
  order_identifier: 'mock-captured-order-identifier',
  status: 'started',
  status_title: 'در انتظار',
  invoice: {
    id: 343,
    invoice_identifier: 'mock-captured-invoice-identifier',
    invoice_items: [
      {
        id: 766,
        name: 'Zishop - زی‌شاپ',
        no_of_items: 1,
        product_variant: {
          id: 1051,
          sku: 'IN1753001109',
          price: 840000,
          raw_price: 1000000,
          product_attributes: null,
          commercial_files: null,
          product: {
            id: 499,
            name: 'Zishop - زی‌شاپ',
            product_type: 'simple',
          },
        },
        form_attributes: {},
        booking_attributes: null,
        customer_profit: 160000,
        customer_profit_percentage: 16,
        single_item_price: 840000,
        total_items_price: 840000,
        variant_attributes: [],
      },
    ],
    discount_total: 0,
    discount_usages: null,
    final_total: 840000,
    items_discount: 160000,
    items_total_raw_price: 1000000,
    net_total: 840000,
    shipping_method_needed: false,
    shipping_total: 0,
    shipping_items: [
      {
        id: '',
        shipping_number: 'SH-MOCK-0001',
        invoice_item_ids: [766],
        rate: {
          id: 5,
          name: 'رایگان',
          description: '',
          icon: 'free-delivery',
          color: '',
          price: 0,
          type: 'free',
        },
        status: 'started',
        status_title: 'در انتظار',
      },
    ],
    receipts: null,
    vat: 0,
    vat_percent: 0,
  },
  receipt: {
    id: 132,
    receipt_ref: '',
    image_url: '',
    receipt_amount: 840000,
    payment: {
      id: MOCK_PAYMENT_ID,
      payment_status: 'waiting_for_approval',
      payment_status_fa: 'در انتظار تایید',
      payment_amount: 840000,
      payment_identifier: MOCK_PAYMENT_IDENTIFIER,
      payment_type: {
        id: 3,
        title: 'paymentinplace',
        title_fa: 'پرداخت در محل',
        reference_code: 'paymentinplace',
        payment_sub_type: 102,
      },
    },
  },
};

const MOCK_RETRY_ITEM = {
  id: 766,
  productVariantId: 1051,
  name: 'Zishop - زی‌شاپ',
  attributes: [],
  quantity: 1,
  unitPrice: 840000,
  lineTotal: 840000,
  rawPrice: 1000000,
  customerProfit: 160000,
  product: {
    name: 'Zishop - زی‌شاپ',
    variantId: 1051,
    productType: 'simple',
  },
};

const MOCK_RETRY_CART = {
  id: 1,
  identifier: '019f1879-bcbe-7bdf-b50a-fec3ca7f0b9d',
  items: [MOCK_RETRY_ITEM],
  netTotal: 840000,
  grossTotal: 1000000,
  needsShipping: false,
  minBasketLimitViolated: false,
};

const MOCK_RETRY_INVOICE = {
  id: 343,
  identifier: 'mock-retry-invoice-identifier',
  items: [MOCK_RETRY_ITEM],
  shippingItems: [],
  needsShipping: false,
  netTotal: 840000,
  finalTotal: 840000,
  vat: 0,
  vatPercent: 0,
  itemsDiscount: 160000,
  discountTotal: 0,
  customerProfit: 160000,
  customerProfitPercentage: 16,
  itemsTotalRawPrice: 1000000,
  couponTotal: 0,
  shippingTotal: 0,
  creditTotal: 0,
  discountUsages: [],
};

const MOCK_RETRY_PAYMENT_METHODS = {
  payment_types: [
    {
      id: 3,
      reference_code: 'zarinpalpayment',
      title: 'Online payment',
      title_fa: 'پرداخت آنلاین',
      description: 'پرداخت امن از طریق درگاه بانکی',
      payment_sub_type: null,
      order: 1,
      is_default: true,
    },
  ],
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
          form.get('RefId') === 'mock-bank-reference';

        if (!hasValidContract) {
          return jsonResponse({
            error: 'Mock callback expected direct URL-encoded gateway fields.',
            error_code: 400,
            status: 400,
          }, 400);
        }
      }

      return paymentStepResponse({
        result: mockPaymentResult(mockPayment, isStatusPoll),
        error: '',
        error_code: 0,
        status: 0,
      });
    }

    // Successful verification invokes the existing idempotent pinch hook.
    if (mockPayment !== 'live' && url.includes('/api/v1/pinch/order')) {
      return jsonResponse({ result: true });
    }

    // Mock returns can be opened directly without a previously bootstrapped
    // browser session. Keep retry deterministic instead of depending on a
    // stale demo cart or the live shop API.
    if (mockPayment !== 'live' && url.includes('/api/v2/carts/0')) {
      return jsonResponse({ result: MOCK_RETRY_CART });
    }
    if (mockPayment !== 'live' && url.endsWith('/api/v2/invoices')) {
      return jsonResponse({ result: MOCK_RETRY_INVOICE });
    }
    if (mockPayment !== 'live' && url.includes('/api/v2/payments/list')) {
      return jsonResponse({ result: MOCK_RETRY_PAYMENT_METHODS });
    }
    if (mockPayment !== 'live' && url.includes('/api/v2/regions')) {
      return jsonResponse({ result: { regions: [] } });
    }
    if (mockPayment !== 'live' && url.includes('/api/v2/general/info')) {
      return jsonResponse({ result: {} });
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
        order: MOCK_CAPTURED_SUCCESS_ORDER,
        address: '',
        format: '',
        payload: {},
        time: 0,
        callback: '',
        token: '',
        RedeemToken: '',
        IsInitialize: false,
        message: null,
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

function paymentStepResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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
          credentials={{ cart: { identifier: settings.cartIdentifier } }}
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
            continueShoppingUrl: `https://${settings.domain}/`,
            pollIntervalMs: settings.mockPayment === 'pending-success' ? 250 : 15000,
            theme: { accent: '#4f46e5', radius: 16, fontFamily: 'var(--font-vazirmatn), sans-serif' },
          }}
        />
      </SazitoProvider>
    </>
  );
}
