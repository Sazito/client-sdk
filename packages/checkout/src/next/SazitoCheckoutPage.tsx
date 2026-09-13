'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { CheckoutProvider, useCheckout, useSazitoClient } from '../react';
import {
  SazitoCheckout,
  type SazitoCheckoutProps,
  type EmptyCartOptions,
  type RenderButtonProps,
  type RenderEmptyCartProps,
  type RenderResultProps,
} from '../ui';
import { parsePaymentReturnUrl, stripPaymentStatusReturn } from '../core';
import type {
  CheckoutConfig,
  CheckoutCredentials,
  CheckoutPaymentReturn,
  PaymentReturnResolution
} from '../core';

export interface SazitoCheckoutPageProps {
  credentials?: CheckoutCredentials;
  config?: CheckoutConfig;
  /** Parsed nested gateway callback. Prefer `parsePaymentReturn()` to create it. */
  paymentReturn?: CheckoutPaymentReturn;
  /** @deprecated Prefer `paymentReturn`; retained for query-only callbacks. */
  paymentReturnParams?: Record<string, string>;
  className?: string;
  /** Build the order-details link for your storefront routes; return null to hide it. */
  getOrderDetailsUrl?: SazitoCheckoutProps['getOrderDetailsUrl'];
  renderNextButton?: (props: RenderButtonProps) => React.ReactNode;
  renderBackButton?: (props: RenderButtonProps) => React.ReactNode;
  renderEmptyCart?: (props: RenderEmptyCartProps) => React.ReactNode;
  renderResult?: (props: RenderResultProps) => React.ReactNode;
  emptyCart?: EmptyCartOptions;
}

export function SazitoCheckoutPage({
  credentials,
  config,
  paymentReturn,
  paymentReturnParams,
  className,
  getOrderDetailsUrl,
  renderNextButton,
  renderBackButton,
  renderEmptyCart,
  renderResult,
  emptyCart,
}: SazitoCheckoutPageProps) {
  // The explicit server-parsed value remains authoritative. As a fallback,
  // detect Sazito's well-known nested callback in the browser. This prevents a
  // caught callback route from silently booting a fresh checkout when the host
  // forgot to forward its catch-all params.
  // Retain the entry callback after ResolveReturn cleans the visible URL.
  // Host rerenders must not change autoStart or discard payment credentials.
  const [detectedPaymentReturn] = useState(() =>
    typeof window !== 'undefined'
      ? parsePaymentReturnUrl(window.location.href)
      : undefined
  );
  const resolvedPaymentReturn = paymentReturn ?? (paymentReturnParams == null ? detectedPaymentReturn : undefined);
  const returnParams = resolvedPaymentReturn?.params ?? paymentReturnParams;
  const returnResolution = resolvedPaymentReturn?.resolution ?? 'callback';
  const isReturn = returnParams != null;
  const checkoutCredentials = resolvedPaymentReturn
    ? { ...credentials, payment: resolvedPaymentReturn.payment }
    : credentials;
  const client = useSazitoClient();

  return (
    <CheckoutProvider
      client={client}
      credentials={checkoutCredentials}
      config={config}
      autoStart={!isReturn}
    >
      {returnParams ? (
        <ResolveReturn params={returnParams} resolution={returnResolution} />
      ) : null}
      <SazitoCheckout
        theme={config?.theme}
        continueShoppingUrl={config?.continueShoppingUrl}
        className={className}
        getOrderDetailsUrl={getOrderDetailsUrl}
        renderNextButton={renderNextButton}
        renderBackButton={renderBackButton}
        renderEmptyCart={renderEmptyCart}
        renderResult={renderResult}
        emptyCart={emptyCart}
      />
    </CheckoutProvider>
  );
}

function ResolveReturn({
  params,
  resolution
}: {
  params: Record<string, string>;
  resolution: PaymentReturnResolution;
}) {
  const { actions } = useCheckout();
  const paramsKey = JSON.stringify(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  );

  useEffect(() => {
    // Deduplication belongs to the engine so replacing the SDK/session still
    // resolves this callback, while Strict Mode replays share one request.
    void actions.resolvePaymentReturn(params, resolution);
    if (typeof window !== 'undefined') {
      const cleanUrl = stripPaymentStatusReturn(window.location.href);
      if (cleanUrl) window.history.replaceState(window.history.state, '', cleanUrl);
    }
  }, [actions, params, paramsKey, resolution]);
  return null;
}
