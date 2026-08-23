'use client';

import { useEffect } from 'react';
import type React from 'react';
import { CheckoutProvider, useCheckout, useSazitoClient } from '../react';
import {
  SazitoCheckout,
  type EmptyCartOptions,
  type RenderButtonProps,
  type RenderEmptyCartProps,
} from '../ui';
import type { CheckoutConfig, CheckoutCredentials } from '../core';

export interface SazitoCheckoutPageProps {
  credentials?: CheckoutCredentials;
  config?: CheckoutConfig;
  paymentReturnParams?: Record<string, string>;
  className?: string;
  renderNextButton?: (props: RenderButtonProps) => React.ReactNode;
  renderBackButton?: (props: RenderButtonProps) => React.ReactNode;
  renderEmptyCart?: (props: RenderEmptyCartProps) => React.ReactNode;
  emptyCart?: EmptyCartOptions;
}

export function SazitoCheckoutPage({
  credentials,
  config,
  paymentReturnParams,
  className,
  renderNextButton,
  renderBackButton,
  renderEmptyCart,
  emptyCart,
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
        emptyCart={emptyCart}
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
