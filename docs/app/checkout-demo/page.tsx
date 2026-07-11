'use client';

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

const sazito = createSazitoClient({
  domain: 'noel-accessories.ir',
  customFetchApi: demoFetch,
});

export default function CheckoutDemoPage() {
  return (
    <SazitoProvider client={sazito}>
      <SazitoCheckoutPage
        credentials={{ cart: { identifier: '019f1879-bcbe-7bdf-b50a-fec3ca7f0b9d' } }}
        config={{
          locale: 'fa',
          continueShoppingUrl: '/',
          theme: { accent: '#4f46e5', radius: 16, fontFamily: 'var(--font-vazirmatn), sans-serif' },
        }}
      />
    </SazitoProvider>
  );
}
