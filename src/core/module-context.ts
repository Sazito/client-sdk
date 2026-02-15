import { CredentialsManager } from '../utils/credentials-manager';
import type { SazitoConfig } from './config';
import { mergeConfig } from './config';
import { HttpClient } from './http-client';

export interface ModuleContext {
  http: HttpClient;
  credentials: CredentialsManager;
}

/**
 * Create a shared module context so multiple API modules can share
 * one HttpClient and one credential store.
 */
export function createModuleContext(config: SazitoConfig): ModuleContext {
  const mergedConfig = mergeConfig(config);

  return {
    http: new HttpClient(mergedConfig),
    credentials: new CredentialsManager()
  };
}

export function isModuleContext(value: unknown): value is ModuleContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ModuleContext>;
  return candidate.http instanceof HttpClient && candidate.credentials instanceof CredentialsManager;
}

export function ensureModuleContext(configOrContext: SazitoConfig | ModuleContext): ModuleContext {
  return isModuleContext(configOrContext)
    ? configOrContext
    : createModuleContext(configOrContext);
}
