import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { ProductsAPI } from '../api/products';

export * from '../api/products';

export function createProductsAPI(configOrContext: SazitoConfig | ModuleContext): ProductsAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new ProductsAPI(http);
}
