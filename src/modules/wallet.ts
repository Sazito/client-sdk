import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { WalletAPI } from '../api/wallet';

export * from '../api/wallet';

export function createWalletAPI(configOrContext: SazitoConfig | ModuleContext): WalletAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new WalletAPI(http);
}
