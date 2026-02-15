import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { ShippingAPI } from '../api/shipping';

export * from '../api/shipping';

export function createShippingAPI(configOrContext: SazitoConfig | ModuleContext): ShippingAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);
  return new ShippingAPI(http, credentials);
}
