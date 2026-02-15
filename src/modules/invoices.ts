import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { InvoicesAPI } from '../api/invoices';

export * from '../api/invoices';

export function createInvoicesAPI(configOrContext: SazitoConfig | ModuleContext): InvoicesAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);
  return new InvoicesAPI(http, credentials);
}
