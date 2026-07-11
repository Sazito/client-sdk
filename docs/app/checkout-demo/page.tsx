'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSazitoClient } from '@sazito/client-sdk';
import { SazitoProvider, SazitoCheckoutPage } from '@sazito/checkout/next';

const SAZITO_API_ORIGIN = 'http://api.sazito.com:8080';

const demoFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

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

const DEFAULT_DOMAIN = 'noel-accessories.ir';
const DEFAULT_CART_IDENTIFIER = '019f1879-bcbe-7bdf-b50a-fec3ca7f0b9d';
const SETTINGS_STORAGE_KEY = 'sazito-checkout-demo-settings';

interface DemoSettings {
  domain: string;
  cartIdentifier: string;
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
  };
}

function persistSettings(settings: DemoSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  const url = new URL(window.location.href);
  url.searchParams.set('domain', settings.domain);
  url.searchParams.set('cart', settings.cartIdentifier);
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

  const dirty =
    domain.trim() !== settings.domain || cartIdentifier.trim() !== settings.cartIdentifier;

  return (
    <form
      dir="ltr"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({ domain: domain.trim(), cartIdentifier: cartIdentifier.trim() });
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
      <button
        type="submit"
        disabled={!dirty || !domain.trim() || !cartIdentifier.trim()}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: 'none',
          background: dirty ? '#4f46e5' : '#cbd5e1',
          color: '#fff',
          fontSize: 14,
          cursor: dirty ? 'pointer' : 'default',
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
        ? createSazitoClient({ domain: settings.domain, customFetchApi: demoFetch })
        : null,
    [settings?.domain],
  );

  if (!settings || !sazito) {
    return null;
  }

  return (
    <>
      <DemoSettingsBar
        key={`${settings.domain}:${settings.cartIdentifier}`}
        settings={settings}
        onApply={(next) => {
          persistSettings(next);
          setSettings(next);
        }}
      />
      <SazitoProvider client={sazito}>
        <SazitoCheckoutPage
          key={`${settings.domain}:${settings.cartIdentifier}`}
          credentials={{ cart: { identifier: settings.cartIdentifier } }}
          config={{
            locale: 'fa',
            continueShoppingUrl: '/',
            theme: { accent: '#4f46e5', radius: 16, fontFamily: 'var(--font-vazirmatn), sans-serif' },
          }}
        />
      </SazitoProvider>
    </>
  );
}
