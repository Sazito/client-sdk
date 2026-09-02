import {
  CredentialsManager,
  type SazitoClient
} from '@sazito/client-sdk';
import type { CheckoutCredentials, CheckoutEngineOptions } from './types';

export interface CheckoutSdkBinding {
  client: SazitoClient;
  credentials: CredentialsManager;
  hasCart(): boolean;
  hasInvoice(): boolean;
}

export function createSdkBinding(options: CheckoutEngineOptions): CheckoutSdkBinding {
  const client = options.client as SazitoClient | undefined;

  if (!client) {
    throw new Error(
      '[@sazito/checkout] No client found. Wrap your app with <SazitoProvider client={sazito}> or pass a `client` prop to CheckoutProvider.'
    );
  }

  const credentials = getClientCredentialsManager(client) ?? new CredentialsManager();
  seedCredentials(credentials, options.credentials);

  return {
    client,
    credentials,
    hasCart() {
      return credentials.getCartCredentials() !== null;
    },
    hasInvoice() {
      return credentials.getInvoiceCredentials() !== null;
    }
  };
}

function getClientCredentialsManager(client: SazitoClient): CredentialsManager | undefined {
  const candidate = client as unknown as {
    getCredentialsManager?: () => CredentialsManager;
    credentialsManager?: CredentialsManager;
  };

  if (typeof candidate.getCredentialsManager === 'function') {
    return candidate.getCredentialsManager();
  }

  if (candidate.credentialsManager instanceof CredentialsManager) {
    return candidate.credentialsManager;
  }

  return undefined;
}

function seedCredentials(
  credentials: CredentialsManager,
  seed?: CheckoutCredentials
): void {
  if (!seed) return;
  if (seed.cart?.identifier) {
    credentials.setCartCredentials({ identifier: seed.cart.identifier });
  }
  if (seed.invoice?.identifier && typeof seed.invoice.id === 'number') {
    credentials.setInvoiceCredentials({ id: seed.invoice.id, identifier: seed.invoice.identifier });
  }
  if (seed.payment?.identifier && typeof seed.payment.id === 'number') {
    credentials.setPaymentCredentials({ id: seed.payment.id, identifier: seed.payment.identifier });
  }
}
