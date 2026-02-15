import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { GeneralAPI } from '../api/general';

export * from '../api/general';

export function createGeneralAPI(configOrContext: SazitoConfig | ModuleContext): GeneralAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new GeneralAPI(http);
}
