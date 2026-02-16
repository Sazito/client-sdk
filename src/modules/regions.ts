import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { RegionsAPI } from '../api/regions';

export * from '../api/regions';

export function createRegionsAPI(configOrContext: SazitoConfig | ModuleContext): RegionsAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new RegionsAPI(http);
}
