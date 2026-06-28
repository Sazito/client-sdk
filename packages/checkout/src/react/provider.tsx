'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import {
  createCheckoutEngine,
  createBrowserEffectExecutor,
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

  const cartIdentifier = credentials?.cart?.identifier;
  const invoiceId = credentials?.invoice?.id;
  const invoiceIdentifier = credentials?.invoice?.identifier;
  const engine = useMemo<CheckoutEngine>(() => {
    const nextEngine = createCheckoutEngine({ client, credentials, config });
    nextEngine.setEffectExecutor(createBrowserEffectExecutor(config));
    return nextEngine;
    // Recreate only when the SDK/session changes. Config-only updates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, cartIdentifier, invoiceId, invoiceIdentifier]);

  useEffect(() => {
    engine.setEffectExecutor(createBrowserEffectExecutor(config));
  }, [engine, config]);

  useEffect(() => {
    if (autoStart) {
      void engine.actions.start();
    }
    return () => engine.destroy();
  }, [engine, autoStart]);

  const value = useMemo(() => engine, [engine]);

  return <CheckoutEngineContext.Provider value={value}>{children}</CheckoutEngineContext.Provider>;
}
