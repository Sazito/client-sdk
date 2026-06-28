'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface SazitoContextValue {
  client: unknown;
}

const SazitoClientContext = createContext<SazitoContextValue | null>(null);

export interface SazitoProviderProps {
  client: unknown;
  children: ReactNode;
}

export function SazitoProvider({ client, children }: SazitoProviderProps) {
  return (
    <SazitoClientContext.Provider value={{ client }}>
      {children}
    </SazitoClientContext.Provider>
  );
}

export function useSazitoClient(): unknown {
  return useContext(SazitoClientContext)?.client;
}
