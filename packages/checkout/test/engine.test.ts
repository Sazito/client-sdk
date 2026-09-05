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
    isAuthenticated: vi.fn(() => false),
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
      createAddress: vi.fn(async () => ok({ id: 9, identifier: 'addr1', firstName: 'A', lastName: 'B', address: 'x', city: { id: 70, name: 'Tehran' } })),
      updateAddress: vi.fn(async () => ok({ id: 9, identifier: 'addr1', firstName: 'A', lastName: 'B', address: 'x', city: { id: 70, name: 'Tehran' } })),
      getAddress: vi.fn(async () => ok({ id: 9, identifier: 'addr1', firstName: 'A', lastName: 'B', address: 'x', city: { id: 70, name: 'Tehran' } })),
      listAddresses: vi.fn(async () => ok([]))
    },
    payments: {
      getMethods: vi.fn(async () => ok([{ id: 3, code: 'zarinpalpayment', isDefault: true }])),
      create: vi.fn(async () => ok({ id: 8, identifier: 'p1', paymentType: { code: 'zarinpalpayment' }, amount: 1200 })),
      initialize: vi.fn(async () => ok({ action: 'REDIRECT', address: 'https://gateway/pay' })),
      verify: vi.fn(async () => ok({ action: 'show_order', order: { id: 1, orderNumber: 'ORD-1', orderIdentifier: 'oi', invoice: { shippingItems: [], invoiceItems: [], netTotal: 0, finalTotal: 0 } } })),
      pollUntilSettled: vi.fn(async () => ok({ action: 'show_order', order: { id: 1, orderNumber: 'ORD-1', orderIdentifier: 'oi', invoice: { shippingItems: [], invoiceItems: [], netTotal: 0, finalTotal: 0 } } }))
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
  it('stops at the empty-cart state before creating an invoice when credentials are missing', async () => {
    const client = makeMockClient();
    const engine = createCheckoutEngine({ client, config: { locale: 'en' } });

    await engine.actions.start();

    expect(engine.getState().error?.code).toBe('no_cart');
    expect(client.cart.get).not.toHaveBeenCalled();
    expect(client.invoices.create).not.toHaveBeenCalled();
  });

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

  it('publishes bootstrap atomically and ignores duplicate starts', async () => {
    const { engine, client } = setup();
    const listener = vi.fn();
    engine.subscribe(listener);

    await Promise.all([engine.actions.start(), engine.actions.start()]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(client.cart.get).toHaveBeenCalledTimes(1);
    expect(client.invoices.create).toHaveBeenCalledTimes(1);
    expect(client.regions.list).toHaveBeenCalledTimes(1);
    expect(client.general.getInfo).toHaveBeenCalledTimes(1);
  });

  it('seeds credentials on the injected SDK client manager', async () => {
    const credentials = new CredentialsManager(new MemoryStorage());
    const client = {
      ...makeMockClient(),
      getCredentialsManager: () => credentials
    };
    const engine = createCheckoutEngine({
      client,
      credentials: {
        cart: { identifier: 'isolated-cart' },
        payment: { id: 304, identifier: 'return-payment' }
      }
    });

    expect(credentials.getCartCredentials()?.identifier).toBe('isolated-cart');
    expect(credentials.getPaymentCredentials()).toEqual({
      id: 304,
      identifier: 'return-payment'
    });
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

  it('updates invoice pricing only after the quantity refresh resolves', async () => {
    const { engine, client } = setup();
    const updatedCart = {
      id: 1,
      identifier: 'c1',
      items: [{
        id: 10,
        productVariantId: 100,
        quantity: 2,
        unitPrice: 1000,
        lineTotal: 2000,
        product: { variantId: 100, name: 'Shoe', attributes: [] }
      }],
      netTotal: 2000,
      needsShipping: true,
      minBasketLimitViolated: false
    };
    const refreshedInvoice = makeInvoice({
      items: [
        { id: 50, productVariantId: 100, name: 'Shoe', attributes: [], quantity: 2, unitPrice: 1000, lineTotal: 2000, rawPrice: 1000, customerProfit: 0 }
      ],
      netTotal: 2000,
      finalTotal: 2000,
      itemsTotalRawPrice: 2000
    });
    let resolveRefresh!: (value: ReturnType<typeof ok>) => void;

    client.cart.updateItem.mockResolvedValueOnce(ok(updatedCart) as never);
    client.invoices.refresh.mockImplementationOnce(
      () => new Promise((resolve) => { resolveRefresh = resolve; }) as never
    );

    await engine.actions.start();
    const update = engine.actions.updateItemQuantity(10, 100, 2);
    await vi.waitFor(() => expect(client.invoices.refresh).toHaveBeenCalledOnce());

    expect(engine.getState().cart?.items[0]?.quantity).toBe(2);
    expect(engine.getState().invoice?.finalTotal).toBe(1000);

    resolveRefresh(ok(refreshedInvoice));
    await update;

    expect(engine.getState().invoice?.finalTotal).toBe(2000);
  });

  it('prefills a saved SDK address and keeps it when entering shipping', async () => {
    const credentials = new CredentialsManager(new MemoryStorage());
    credentials.setShippingCredentials({ id: 0, identifier: 'saved-address' });
    const client = {
      ...makeMockClient(),
      isAuthenticated: vi.fn(() => false),
      getCredentialsManager: () => credentials
    };
    client.invoices.create.mockResolvedValueOnce(ok(makeInvoice({
      shippingAddress: {
        identifier: '',
        firstName: '',
        lastName: '',
        address: '',
        region: { id: 0, name: '', city: { id: 0, name: '' } }
      }
    })) as never);
    client.shipping.getAddress.mockResolvedValueOnce(ok({
      id: 0,
      identifier: 'saved-address',
      firstName: 'Ali',
      lastName: 'Rezaei',
      mobilePhone: '09120000000',
      email: 'ali@example.com',
      phoneNumber: '02100000000',
      region: { id: 7, name: 'Tehran' },
      city: { id: 70, name: 'Tehran' },
      postalCode: '1234567890',
      address: 'Saved street',
      description: 'Saved note'
    }) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    expect(client.shipping.getAddress).toHaveBeenCalledOnce();
    expect(engine.getState().addressForm).toEqual({
      firstName: 'Ali',
      lastName: 'Rezaei',
      mobilePhone: '09120000000',
      email: 'ali@example.com',
      phoneNumber: '02100000000',
      regionId: 7,
      cityId: 70,
      postalCode: '1234567890',
      address: 'Saved street',
      description: 'Saved note'
    });

    await engine.actions.next();
    expect(engine.getState().step).toBe('shipping');
    expect(engine.getState().addressForm.firstName).toBe('Ali');
    expect(engine.getState().addressForm.address).toBe('Saved street');
    await vi.waitFor(() => {
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledOnce();
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
  });

  it('keeps the reconciled invoice city and loads methods when entering shipping', async () => {
    const client = makeMockClient();
    const invoiceWithMismatchedCity = makeInvoice({
      shippingAddress: {
        identifier: 'invoice-address',
        firstName: 'Ali',
        lastName: 'Rezaei',
        mobilePhone: '09120000000',
        address: 'Saved street',
        region: {
          id: 7,
          name: 'Tehran',
          city: { id: 999, name: 'Tehran' }
        }
      }
    });
    client.invoices.create.mockResolvedValue(ok(invoiceWithMismatchedCity) as never);
    client.invoices.refresh.mockResolvedValue(ok(invoiceWithMismatchedCity) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    expect(engine.getState().addressForm.cityId).toBe(70);

    await engine.actions.next();

    await vi.waitFor(() => {
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledOnce();
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
    expect(engine.getState().step).toBe('shipping');
    expect(engine.getState().addressForm.cityId).toBe(70);
  });

  it('reloads shipping methods on entry when applicable data has no usable groups', async () => {
    const client = makeMockClient();
    const invoiceWithAddress = makeInvoice({
      shippingAddress: {
        identifier: 'invoice-address',
        firstName: 'Ali',
        lastName: 'Rezaei',
        mobilePhone: '09120000000',
        address: 'Saved street',
        region: {
          id: 7,
          name: 'Tehran',
          city: { id: 70, name: 'Tehran' }
        }
      }
    });
    client.invoices.create.mockResolvedValue(ok(invoiceWithAddress) as never);
    client.invoices.refresh.mockResolvedValue(ok(invoiceWithAddress) as never);
    client.invoices.getApplicableShippingMethods
      .mockResolvedValueOnce(ok({
        shippingMethods: [],
        groupedShippingRates: {},
        itemsShippingRate: []
      }) as never)
      .mockResolvedValueOnce(ok(applicable) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    await engine.actions.next();
    await vi.waitFor(() => {
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledOnce();
    });
    expect(engine.getState().applicable).not.toBeNull();
    expect(engine.getState().shippingGroups).toEqual([]);

    engine.actions.back();
    await engine.actions.next();

    await vi.waitFor(() => {
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledTimes(2);
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
  });

  it('falls back to identifier credentials when a token address list is empty', async () => {
    const credentials = new CredentialsManager(new MemoryStorage());
    credentials.setShippingCredentials({ id: 0, identifier: '02a271d33a0e2513cef290eb7205e608' });
    const client = {
      ...makeMockClient(),
      isAuthenticated: vi.fn(() => true),
      getCredentialsManager: () => credentials
    };
    client.shipping.getAddress.mockResolvedValueOnce(ok({
      id: 0,
      identifier: '02a271d33a0e2513cef290eb7205e608',
      firstName: 'Stored',
      lastName: 'Address',
      mobilePhone: '09120000000',
      region: { id: 7, name: 'Tehran' },
      city: { id: 70, name: 'Tehran' },
      address: 'Identifier street'
    }) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();

    expect(client.shipping.listAddresses).toHaveBeenCalledOnce();
    expect(client.shipping.getAddress).toHaveBeenCalledOnce();
    expect(engine.getState().addressForm.firstName).toBe('Stored');
    expect(engine.getState().addressForm.address).toBe('Identifier street');
  });

  it('prefills the latest account address when the SDK has a user token', async () => {
    const client = {
      ...makeMockClient(),
      isAuthenticated: vi.fn(() => true)
    };
    client.shipping.listAddresses.mockResolvedValueOnce(ok([
      {
        id: 11,
        identifier: 'latest',
        firstName: 'Latest',
        lastName: 'User',
        mobilePhone: '09121111111',
        region: { id: 7, name: 'Tehran' },
        city: { id: 70, name: 'Tehran' },
        address: 'Latest street'
      },
      {
        id: 10,
        identifier: 'older',
        firstName: 'Older',
        lastName: 'User',
        mobilePhone: '09120000000',
        region: { id: 7, name: 'Tehran' },
        city: { id: 70, name: 'Tehran' },
        address: 'Older street'
      }
    ]) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();

    expect(client.shipping.listAddresses).toHaveBeenCalledOnce();
    expect(client.shipping.getAddress).not.toHaveBeenCalled();
    expect(engine.getState().addressForm.firstName).toBe('Latest');
    expect(engine.getState().addressForm.address).toBe('Latest street');
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

    expect(client.shipping.createAddress).toHaveBeenCalled();
    expect(client.shipping.updateAddress).not.toHaveBeenCalled();
    expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalled();
    const state = engine.getState();
    expect(state.step).toBe('shipping');
    expect(state.shippingGroups).toHaveLength(1);
    expect(state.shippingGroups[0].rates).toHaveLength(2);

    engine.actions.setAddressField('address', 'A different street');
    expect(engine.getState().applicable).not.toBeNull();
    expect(engine.getState().shippingGroups).toHaveLength(1);
    expect(client.shipping.createAddress).toHaveBeenCalledTimes(1);
    expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledTimes(1);

    await engine.actions.submitAddress();
    expect(client.shipping.createAddress).toHaveBeenCalledTimes(2);
    expect(client.shipping.updateAddress).not.toHaveBeenCalled();
    expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledTimes(1);
    expect(engine.getState().shippingGroups).toHaveLength(1);

    engine.actions.setAddressField('cityId', 71);
    expect(engine.getState().addressForm.cityId).toBe(71);
    expect(engine.getState().shippingGroups).toEqual([]);
    await vi.waitFor(() => {
      expect(client.shipping.createAddress).toHaveBeenCalledTimes(3);
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledTimes(2);
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
    expect(engine.getState().addressForm.cityId).toBe(71);
  });

  it('loads shipping methods after autofill completes the address form', async () => {
    const { engine, client } = setup();
    await engine.actions.start();
    await engine.actions.next();

    // Browser autofill commonly populates selects before the final text field.
    engine.actions.setAddressField('firstName', 'Ali');
    engine.actions.setAddressField('lastName', 'Rezaei');
    engine.actions.setAddressField('mobilePhone', '09120000000');
    engine.actions.setAddressField('regionId', 7);
    engine.actions.setAddressField('cityId', 70);
    engine.actions.setAddressField('address', 'Autofilled street');

    await vi.waitFor(() => {
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledOnce();
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
  });

  it('does not submit an automatic Digital/Service group as a shipping method', async () => {
    const client = makeMockClient();
    const digitalInvoice = makeInvoice({
      items: [
        { id: 51, productVariantId: 101, productType: 'service', name: 'Consultation', attributes: [], quantity: 1, unitPrice: 1000, lineTotal: 1000, rawPrice: 1000, customerProfit: 0 }
      ]
    });
    const digitalApplicable = {
      shippingMethods: [{ id: 9, name: 'Digital/Service', type: 'service' }],
      groupedShippingRates: {
        service: [{ id: 9, name: 'Digital/Service', type: 'service', price: 0 }]
      },
      itemsShippingRate: [
        { invoiceItemId: 51, shippingRate: { id: 9, name: 'Digital/Service', type: 'service', price: 0 } }
      ]
    };
    client.invoices.create.mockResolvedValue(ok(digitalInvoice) as never);
    client.invoices.refresh.mockResolvedValue(ok(digitalInvoice) as never);
    client.invoices.addShippingAddress.mockResolvedValue(ok(digitalInvoice) as never);
    client.invoices.getApplicableShippingMethods.mockResolvedValue(ok(digitalApplicable) as never);
    const engine = createCheckoutEngine({
      client,
      credentials: { cart: { identifier: 'c1' } }
    });

    await engine.actions.start();
    await engine.actions.next();
    engine.actions.setAddressField('firstName', 'Ali');
    engine.actions.setAddressField('lastName', 'Rezaei');
    engine.actions.setAddressField('mobilePhone', '09120000000');
    engine.actions.setAddressField('regionId', 7);
    engine.actions.setAddressField('cityId', 70);
    engine.actions.setAddressField('address', 'Tehran');

    expect(await engine.actions.submitAddress()).toBe(true);
    expect(client.invoices.assignShippingMethod).not.toHaveBeenCalled();
    expect(engine.getState().error).toBeNull();
  });

  it('keeps the newest city when an older address save finishes late', async () => {
    const { engine, client } = setup();
    let resolveFirstCreate!: (value: unknown) => void;
    client.shipping.createAddress.mockImplementationOnce(
      () => new Promise((resolve) => { resolveFirstCreate = resolve; }) as never
    );

    await engine.actions.start();
    await engine.actions.next();
    engine.actions.setAddressField('firstName', 'Ali');
    engine.actions.setAddressField('lastName', 'Rezaei');
    engine.actions.setAddressField('mobilePhone', '09120000000');
    engine.actions.setAddressField('regionId', 7);
    engine.actions.setAddressField('address', 'Somewhere');
    engine.actions.setAddressField('cityId', 70);

    await vi.waitFor(() => expect(client.shipping.createAddress).toHaveBeenCalledTimes(1));
    engine.actions.setAddressField('cityId', 71);
    resolveFirstCreate(ok({
      id: 9,
      identifier: 'stale-address',
      firstName: 'Ali',
      lastName: 'Rezaei',
      address: 'Somewhere',
      city: { id: 70, name: 'Old city' }
    }));

    await vi.waitFor(() => {
      expect(client.shipping.createAddress).toHaveBeenCalledTimes(2);
      expect(client.invoices.addShippingAddress).toHaveBeenCalledTimes(1);
      expect(client.invoices.getApplicableShippingMethods).toHaveBeenCalledTimes(1);
      expect(engine.getState().shippingGroups).toHaveLength(1);
    });
    expect(engine.getState().addressForm.cityId).toBe(71);
    expect(engine.getState().addressDirty).toBe(false);
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
    // 100 off a 1000 items total → detected as a 10% percentage code.
    expect(engine.getState().appliedDiscount).toEqual({
      code: 'SAVE10',
      kind: 'percentage',
      percent: 10,
      amount: 100,
      shippingSaved: 0
    });
  });

  it('clears the applied discount on removal', async () => {
    const { engine } = setup();
    await engine.actions.start();
    engine.actions.setDiscountCode('SAVE10');
    await engine.actions.applyDiscount();
    await engine.actions.removeDiscount();
    expect(engine.getState().appliedDiscountCode).toBeNull();
    expect(engine.getState().appliedDiscount).toBeNull();
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
    // pending → poll → show_order
    await vi.waitFor(() => expect(engine.getState().result?.status).toBe('success'));
    expect(engine.getState().step).toBe('result');
  });

  it('restores payment credentials from callback parameters before verification', async () => {
    const credentials = new CredentialsManager(new MemoryStorage());
    const client = {
      ...makeMockClient(),
      getCredentialsManager: () => credentials
    };
    const engine = createCheckoutEngine({ client });

    await engine.actions.resolvePaymentReturn({
      id: '304',
      paymentIdentifier: 'callback-payment'
    });

    expect(credentials.getPaymentCredentials()).toEqual({
      id: 304,
      identifier: 'callback-payment'
    });
    expect(client.payments.verify).toHaveBeenCalledWith({
      id: 304,
      paymentIdentifier: 'callback-payment'
    });
    expect(engine.getState().result?.status).toBe('success');
  });

  it('forwards gateway-specific callback fields without renaming them', async () => {
    const { engine, client } = setup();

    await engine.actions.resolvePaymentReturn({
      id: '304',
      paymentIdentifier: 'callback-payment',
      RefId: 'bank-reference',
      ResCode: '0'
    });

    expect(client.payments.verify).toHaveBeenCalledWith({
      id: 304,
      paymentIdentifier: 'callback-payment',
      payload: { RefId: 'bank-reference', ResCode: '0' }
    });
  });

  it('moves a verification error into the visible failed result state', async () => {
    const { engine, client } = setup();
    client.payments.verify.mockResolvedValueOnce({
      error: { message: 'Verification response was invalid', type: 'api' }
    } as never);

    await engine.actions.resolvePaymentReturn({
      id: '304',
      paymentIdentifier: 'callback-payment'
    });

    expect(engine.getState().status).toBe('idle');
    expect(engine.getState().result).toEqual({
      status: 'failed',
      message: 'Verification response was invalid'
    });
  });
});
