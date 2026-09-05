import type { SazitoConfig } from '../core/config';
import { mergeConfig } from '../core/config';
import { ensureModuleContext, isModuleContext, type ModuleContext } from '../core/module-context';
import { PaymentsAPI } from '../api/payments';

export * from '../api/payments';

export function createPaymentsAPI(configOrContext: SazitoConfig | ModuleContext): PaymentsAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);
  const paymentsBasePath = isModuleContext(configOrContext)
    ? undefined
    : mergeConfig(configOrContext).paymentsBasePath;
  return new PaymentsAPI(http, credentials, paymentsBasePath);
}
