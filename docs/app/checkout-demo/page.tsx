'use client';

import { createSazitoClient } from '@sazito/client-sdk';
import { SazitoProvider, SazitoCheckoutPage } from '@sazito/checkout/next';

const sazito = createSazitoClient({ domain: 'noel-accessories.ir' });

export default function CheckoutDemoPage() {
  return (
    <SazitoProvider client={sazito}>
      <SazitoCheckoutPage
        credentials={{ cart: { identifier: '019ea7ae-267b-7c0d-a6e9-2636c9348d65' } }}
        config={{
          locale: 'fa',
          continueShoppingUrl: '/',
          theme: { accent: '#4f46e5', radius: 16, fontFamily: 'var(--font-vazirmatn), sans-serif' },
        }}
      />
    </SazitoProvider>
  );
}
