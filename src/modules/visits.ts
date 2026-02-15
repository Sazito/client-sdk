import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { VisitsAPI } from '../api/visits';

export * from '../api/visits';

export function createVisitsAPI(configOrContext: SazitoConfig | ModuleContext): VisitsAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new VisitsAPI(http);
}
