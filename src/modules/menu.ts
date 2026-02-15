import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { MenuAPI } from '../api/menu';

export * from '../api/menu';

export function createMenuAPI(configOrContext: SazitoConfig | ModuleContext): MenuAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new MenuAPI(http);
}
