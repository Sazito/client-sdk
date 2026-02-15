import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { CMSAPI } from '../api/cms';

export * from '../api/cms';

export function createCMSAPI(configOrContext: SazitoConfig | ModuleContext): CMSAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new CMSAPI(http);
}
