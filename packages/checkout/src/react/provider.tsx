'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import {
  createCheckoutEngine,
  createBrowserEffectExecutor,
  parsePaymentReturnUrl,
  stripPaymentStatusReturn,
  type CheckoutConfig,
  type CheckoutCredentials,
  type CheckoutEngine
} from '../core';
import { CheckoutEngineContext } from './context';
import { useSazitoClient } from './client-context';

export interface CheckoutProviderProps {
  /** Override the SazitoProvider client for this checkout instance only. */
  client?: unknown;
  credentials?: CheckoutCredentials;
  config?: CheckoutConfig;
  autoStart?: boolean;
  children: ReactNode;
}

export function CheckoutProvider({
  client: clientProp,
  credentials,
  config,
  autoStart = true,
  children
}: CheckoutProviderProps) {
  const contextClient = useSazitoClient();
  const client = clientProp ?? contextClient;

  // Catch callback URLs at the provider boundary as well as in the Next.js
  // drop-in page. Some storefronts compose CheckoutProvider + SazitoCheckout
  // directly, and would otherwise bootstrap the cart when a gateway returns.
  const detectedPaymentReturn =
    autoStart && typeof window !== 'undefined'
      ? parsePaymentReturnUrl(window.location.href)
      : undefined;
  const effectiveCredentials = detectedPaymentReturn
    ? { ...credentials, payment: detectedPaymentReturn.payment }
    : credentials;
  const paymentReturnKey = detectedPaymentReturn
    ? `${detectedPaymentReturn.resolution ?? 'callback'}:${JSON.stringify(
        Object.entries(detectedPaymentReturn.params).sort(([a], [b]) => a.localeCompare(b))
      )}`
    : null;

  const cartIdentifier = effectiveCredentials?.cart?.identifier;
  const invoiceId = effectiveCredentials?.invoice?.id;
  const invoiceIdentifier = effectiveCredentials?.invoice?.identifier;
  const paymentId = effectiveCredentials?.payment?.id;
  const paymentIdentifier = effectiveCredentials?.payment?.identifier;
  const engine = useMemo<CheckoutEngine>(() => {
    const nextEngine = createCheckoutEngine({ client, credentials: effectiveCredentials, config });
    nextEngine.setEffectExecutor(createBrowserEffectExecutor(config));
    return nextEngine;
    // Recreate only when the SDK/session changes. Config-only updates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, cartIdentifier, invoiceId, invoiceIdentifier, paymentId, paymentIdentifier]);

  useEffect(() => {
    engine.setEffectExecutor(createBrowserEffectExecutor(config));
  }, [engine, config]);

  useEffect(() => {
    if (autoStart) {
      if (detectedPaymentReturn) {
        void engine.actions.resolvePaymentReturn(
          detectedPaymentReturn.params,
          detectedPaymentReturn.resolution
        );
        const cleanUrl = stripPaymentStatusReturn(window.location.href);
        if (cleanUrl) window.history.replaceState(window.history.state, '', cleanUrl);
      } else {
        void engine.actions.start();
      }
    }
    return () => engine.destroy();
    // paymentReturnKey represents the normalized callback params and prevents
    // object identity from retriggering verification on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, autoStart, paymentReturnKey]);

  const value = useMemo(() => engine, [engine]);

  return <CheckoutEngineContext.Provider value={value}>{children}</CheckoutEngineContext.Provider>;
}
