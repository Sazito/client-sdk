import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { BookingAPI } from '../api/booking';

export * from '../api/booking';

export function createBookingAPI(configOrContext: SazitoConfig | ModuleContext): BookingAPI {
  const { http } = ensureModuleContext(configOrContext);
  return new BookingAPI(http);
}
