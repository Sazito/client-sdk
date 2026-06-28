'use client';

import { useEffect } from 'react';
import type React from 'react';
import { CheckoutProvider, useCheckout, useSazitoClient } from '../react';
import { SazitoCheckout, type RenderButtonProps } from '../ui';
import type { CheckoutConfig, CheckoutCredentials } from '../core';

export interface RenderEmptyCartProps {
  continueShoppingUrl?: string;
}

export interface SazitoCheckoutPageProps {
  credentials?: CheckoutCredentials;
  config?: CheckoutConfig;
  paymentReturnParams?: Record<string, string>;
  className?: string;
  renderNextButton?: (props: RenderButtonProps) => React.ReactNode;
  renderBackButton?: (props: RenderButtonProps) => React.ReactNode;
  renderEmptyCart?: (props: RenderEmptyCartProps) => React.ReactNode;
}

export function SazitoCheckoutPage({
  credentials,
  config,
  paymentReturnParams,
  className,
  renderNextButton,
  renderBackButton,
  renderEmptyCart,
}: SazitoCheckoutPageProps) {
  const isReturn = paymentReturnParams != null;
  const client = useSazitoClient();

  return (
    <CheckoutProvider
      client={client}
      credentials={credentials}
      config={config}
      autoStart={!isReturn}
    >
      {isReturn ? <ResolveReturn params={paymentReturnParams} /> : null}
      <SazitoCheckout
        theme={config?.theme}
        continueShoppingUrl={config?.continueShoppingUrl}
        className={className}
        renderNextButton={renderNextButton}
        renderBackButton={renderBackButton}
        renderEmptyCart={renderEmptyCart}
      />
    </CheckoutProvider>
  );
}

function ResolveReturn({ params }: { params: Record<string, string> }) {
  const { actions } = useCheckout();
  useEffect(() => {
    void actions.resolvePaymentReturn(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
