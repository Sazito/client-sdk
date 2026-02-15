import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { UsersAPI } from '../api/users';

export * from '../api/users';

export function createUsersAPI(configOrContext: SazitoConfig | ModuleContext): UsersAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new UsersAPI(http);
}
