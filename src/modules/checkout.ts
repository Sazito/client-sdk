import type { SazitoConfig } from '../core/config';
import { ensureModuleContext, type ModuleContext } from '../core/module-context';
import { CheckoutAPI } from '../api/checkout';
import { CartAPI } from '../api/cart';
import { InvoicesAPI } from '../api/invoices';
import { ShippingAPI } from '../api/shipping';
import { PaymentsAPI } from '../api/payments';

export * from '../api/checkout';

export function createCheckoutAPI(configOrContext: SazitoConfig | ModuleContext): CheckoutAPI {
  const { http, credentials } = ensureModuleContext(configOrContext);

  const cart = new CartAPI(http, credentials);
  const invoices = new InvoicesAPI(http, credentials);
  const shipping = new ShippingAPI(http, credentials);
  const payments = new PaymentsAPI(http, credentials);

  return new CheckoutAPI(cart, invoices, shipping, payments);
}
