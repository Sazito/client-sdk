import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { SearchAPI } from '../api/search';

export * from '../api/search';

export function createSearchAPI(configOrContext: SazitoConfig | ModuleContext): SearchAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new SearchAPI(http);
}
