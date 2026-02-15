import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { ImagesAPI } from '../api/images';

export * from '../api/images';

export function createImagesAPI(configOrContext: SazitoConfig | ModuleContext): ImagesAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new ImagesAPI(http);
}
