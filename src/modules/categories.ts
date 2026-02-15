import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { CategoriesAPI } from '../api/categories';

export * from '../api/categories';

export function createCategoriesAPI(configOrContext: SazitoConfig | ModuleContext): CategoriesAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new CategoriesAPI(http);
}
