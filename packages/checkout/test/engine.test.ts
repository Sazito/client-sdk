import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialsManager, MemoryStorage } from '@sazito/client-sdk';
import { createCheckoutEngine } from '../src/core/orchestrator';
import type { CheckoutEffect } from '../src/core/types';

// --- minimal in-memory localStorage so CredentialsManager works in node ---
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemStorage();
});

function ok<T>(data: T) {
  return { data };
}

function makeInvoice(over: Record<string, unknown> = {}) {
  return {
    id: 5,
    identifier: 'i1',
    items: [
      { id: 50, productVariantId: 100, name: 'Shoe', attributes: [], quantity: 1, unitPrice: 1000, lineTotal: 1000, rawPrice: 1000, customerProfit: 0 }
    ],
    shippingItems: [],
    needsShipping: true,
    netTotal: 1000,
    finalTotal: 1000,
    vat: 0,
    vatPercent: 0,
    itemsDiscount: 0,
    discountTotal: 0,
    customerProfit: 0,
    customerProfitPercentage: 0,
    itemsTotalRawPrice: 1000,
    couponTotal: 0,
    shippingTotal: 0,
    creditTotal: 0,
    discountUsages: [],
    ...over
  };
}

const applicable = {
  shippingMethods: [{ id: 1, name: 'Post', type: 'post' }],
  groupedShippingRates: {
    g1: [
      { id: 1, name: 'Post', price: 200 },
      { id: 2, name: 'Free', price: 0 }
    ]
  },
  itemsShippingRate: [{ invoiceItemId: 50, shippingRate: { id: 1, name: 'Post', price: 200 } }]
};

function makeMockClient() {
  // Track a single invoice so refresh() reflects prior mutations (as the real API does).
  let current = makeInvoice();
  return {
    general: {
      getInfo: vi.fn(async () => ok({
        general: {
          general_info: {
            checkout: { postal_code_mandatory: { enabled: false } }
          }
        }
      }))
    },
    cart: {
      get: vi.fn(async () =>
        ok({ id: 1, identifier: 'c1', items: [], netTotal: 1000, needsShipping: true, minBasketLimitViolated: false })
      ),
      updateItem: vi.fn(),
      removeItem: vi.fn()
    },
    invoices: {
      create: vi.fn(async () => ok(current)),
      get: vi.fn(async () => ok(current)),
      refresh: vi.fn(async () => ok(current)),
      addShippingAddress: vi.fn(async () => ok(current)),
      getApplicableShippingMethods: vi.fn(async () => ok(applicable)),
      assignShippingMethod: vi.fn(async (assignments: Array<{ rateId: number }>) => {
        const rateId = assignments[0]?.rateId ?? 1;
        const price = rateId === 2 ? 0 : 200;
        current = makeInvoice({
          shippingTotal: price,
          finalTotal: 1000 + price,
          shippingItems: [{ invoiceItemIds: [50], rate: { id: rateId, name: 'X', price } }]
        });
        return ok(current);
      }),
      addDiscountCode: vi.fn(async () => {
        current = makeInvoice({ discountTotal: 100, finalTotal: 900 });
        return ok(current);
      })
    },
    regions: {
      list: vi.fn(async () => ok([{ id: 7, name: 'Tehran', cities: [{ id: 70, name: 'Tehran', latitude: 0, longitude: 0 }] }]))
    },
    shipping: {
      updateAddress: vi.fn(async () => ok({ id: 9, identifier: 'addr1', firstName: 'A', lastName: 'B', address: 'x', city: { id: 70, name: 'Tehran' } }))
    },
    payments: {
      getMethods: vi.fn(async () => ok([{ id: 3, code: 'zarinpalpayment', isDefault: true }])),
      create: vi.fn(async () => ok({ id: 8, identifier: 'p1', paymentType: { code: 'zarinpalpayment' }, amount: 1200 })),
      initialize: vi.fn(async () => ok({ action: 'REDIRECT', address: 'https://gateway/pay' })),
      verify: vi.fn(async () => ok({ action: 'showOrder', order: { id: 1, orderNumber: 'ORD-1', orderIdentifier: 'oi', invoice: { shippingItems: [], invoiceItems: [] } } })),
      pollUntilSettled: vi.fn(async () => ok({ action: 'showOrder', order: { id: 1, orderNumber: 'ORD-1', orderIdentifier: 'oi', invoice: { shippingItems: [], invoiceItems: [] } } }))
    }
  };
}

function setup() {
  const client = makeMockClient();
  const effects: CheckoutEffect[] = [];
  const engine = createCheckoutEngine({
    client,
    credentials: { cart: { identifier: 'c1' } },
    config: { locale: 'fa', pollIntervalMs: 1 }
  });
  engine.setEffectExecutor((e) => effects.push(e));
  return { client, engine, effects };
}

describe('checkout engine — happy path', () => {
  it('bootstraps cart + invoice + regions', async () => {
    const { engine, client } = setup();
    await engine.actions.start();
    const state = engine.getState();
    expect(client.cart.get).toHaveBeenCalled();
    expect(client.invoices.create).toHaveBeenCalled();
    expect(client.general.getInfo).toHaveBeenCalled();
    expect(state.invoice?.id).toBe(5);
    expect(state.regions).toHaveLength(1);
    expect(state.step).toBe('cart');
    expect(state.error).toBeNull();
  });

  it('seeds credentials on the injected SDK client manager', async () => {
    const credentials = new CredentialsManager(new MemoryStorage());
    const client = {
      ...makeMockClient(),
      getCredentialsManager: () => credentials
    };
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'isolated-cart' } }
    });

    expect(credentials.getCartCredentials()?.identifier).toBe('isolated-cart');
    await engine.actions.start();
    expect(client.cart.get).toHaveBeenCalled();
    expect(engine.getState().error).toBeNull();
  });

  it('bootstraps safely when a custom client has no general module', async () => {
    const client = makeMockClient();
    delete (client as Partial<typeof client>).general;
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await expect(engine.actions.start()).resolves.toBeUndefined();
    expect(engine.getState().postalCodeMandatory).toBe(false);
  });

  it('reads the postal-code requirement from shop checkout settings', async () => {
    const client = makeMockClient();
    client.general.getInfo.mockResolvedValueOnce(
      ok({
        general: {
          general_info: {
            checkout: { postal_code_mandatory: { enabled: true } }
          }
        }
      }) as never
    );
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    expect(engine.getState().postalCodeMandatory).toBe(true);
  });

  it('treats a disabled postal-code setting object as optional', async () => {
    const client = makeMockClient();
    client.general.getInfo.mockResolvedValueOnce(
      ok({
        general: {
          general_info: {
            checkout: { postal_code_mandatory: { enabled: false } }
          }
        }
      }) as never
    );
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    expect(engine.getState().postalCodeMandatory).toBe(false);
  });

  it('treats email as optional when general info enables emailOptional', async () => {
    const client = makeMockClient();
    client.general.getInfo.mockResolvedValueOnce(
      ok({
        settings: {
          checkout: { emailOptional: true }
        }
      }) as never
    );
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    expect(engine.getState().emailMandatory).toBe(false);
  });

  it('navigates cart → shipping', async () => {
    const { engine } = setup();
    await engine.actions.start();
    await engine.actions.next();
    expect(engine.getState().step).toBe('shipping');
  });

  it('saves the address and derives switchable shipping groups', async () => {
    const { engine, client } = setup();
    await engine.actions.start();
    await engine.actions.next();

    engine.actions.setAddressField('firstName', 'Ali');
    engine.actions.setAddressField('lastName', 'Rezaei');
    engine.actions.setAddressField('mobilePhone', '09120000000');
    engine.actions.setAddressField('regionId', 7);
    engine.actions.setAddressField('cityId', 70);
    engine.actions.setAddressField('address', 'Somewhere');

    await engine.actions.submitAddress(); // phase 1: save address, reveal methods

    expect(client.shipping.updateAddress).toHaveBeenCalled();
    expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalled();
    const state = engine.getState();
    expect(state.step).toBe('shipping');
    expect(state.shippingGroups).toHaveLength(1);
    expect(state.shippingGroups[0].rates).toHaveLength(2);
  });

  it('switches a shipping rate and updates totals', async () => {
    const { engine } = setup();
    await engine.actions.start();
    await engine.actions.next();
    ['firstName', 'lastName', 'mobilePhone', 'address'].forEach((k) =>
      engine.actions.setAddressField(k as 'firstName', 'x')
    );
    engine.actions.setAddressField('regionId', 7);
    engine.actions.setAddressField('cityId', 70);
    await engine.actions.next();

    await engine.actions.selectShippingRate('g1', 2);
    expect(engine.getState().shippingGroups[0].selectedRateId).toBe(2);
  });

  it('applies a discount code', async () => {
    const { engine, client } = setup();
    await engine.actions.start();
    engine.actions.setDiscountCode('SAVE10');
    await engine.actions.applyDiscount();
    expect(client.invoices.addDiscountCode).toHaveBeenCalledWith('SAVE10');
    expect(engine.getState().appliedDiscountCode).toBe('SAVE10');
    expect(engine.getState().invoice?.finalTotal).toBe(900);
  });

  it('places an order and emits a redirect effect', async () => {
    const { engine, effects } = setup();
    await engine.actions.start();
    engine.actions.selectPaymentMethod(3);
    await engine.actions.placeOrder();

    const redirect = effects.find((e) => e.type === 'redirect');
    expect(redirect).toEqual({ type: 'redirect', url: 'https://gateway/pay' });
    expect(engine.getState().status).toBe('redirecting');
  });

  it('resolves a pending payment return to success', async () => {
    const { engine, client } = setup();
    client.payments.verify.mockResolvedValueOnce({ data: { action: 'pending' } } as never);
    await engine.actions.resolvePaymentReturn({});
    // pending → poll → showOrder
    await vi.waitFor(() => expect(engine.getState().result?.status).toBe('success'));
    expect(engine.getState().step).toBe('result');
  });
});
