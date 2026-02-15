import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { EntityRoutesAPI } from '../api/entity-routes';

export * from '../api/entity-routes';

export function createEntityRoutesAPI(configOrContext: SazitoConfig | ModuleContext): EntityRoutesAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new EntityRoutesAPI(http);
}
