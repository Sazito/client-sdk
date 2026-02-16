import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { DynamicFormsAPI } from '../api/dynamic-forms';

export * from '../api/dynamic-forms';

export function createDynamicFormsAPI(configOrContext: SazitoConfig | ModuleContext): DynamicFormsAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new DynamicFormsAPI(http);
}
