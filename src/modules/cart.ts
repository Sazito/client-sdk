import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { CartAPI } from '../api/cart';

export * from '../api/cart';

export function createCartAPI(configOrContext: SazitoConfig | ModuleContext): CartAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);
  return new CartAPI(http, credentials);
}
