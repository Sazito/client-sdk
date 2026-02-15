import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { OrdersAPI } from '../api/orders';

export * from '../api/orders';

export function createOrdersAPI(configOrContext: SazitoConfig | ModuleContext): OrdersAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new OrdersAPI(http);
}
