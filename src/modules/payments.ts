import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { PaymentsAPI } from '../api/payments';

export * from '../api/payments';

export function createPaymentsAPI(configOrContext: SazitoConfig | ModuleContext): PaymentsAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);
  return new PaymentsAPI(http, credentials);
}
