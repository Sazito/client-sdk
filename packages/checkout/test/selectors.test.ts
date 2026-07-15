import { describe, expect, it } from 'vitest';
import {
  buildShippingAssignments,
  classifyAppliedDiscount,
  deriveShippingGroups,
  isAddressComplete,
  isShippingComplete,
  selectDigitalItems,
  selectSummary
} from '../src/core/selectors';
import type { ApplicableShippingMethods, Invoice } from '../src/core/types';

function invoiceFixture(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1,
    identifier: 'inv',
    items: [
      { id: 50, productVariantId: 100, name: 'Shoe', attributes: [], quantity: 1, unitPrice: 1000, lineTotal: 1000, rawPrice: 1200, customerProfit: 0 },
      { id: 51, productVariantId: 101, name: 'eBook', attributes: [], quantity: 1, unitPrice: 500, lineTotal: 500, rawPrice: 500, customerProfit: 0 }
    ],
    shippingItems: [],
    needsShipping: true,
    netTotal: 1500,
    finalTotal: 1700,
    vat: 0,
    vatPercent: 0,
    itemsDiscount: 200,
    discountTotal: 0,
    customerProfit: 0,
    customerProfitPercentage: 0,
    itemsTotalRawPrice: 1700,
    couponTotal: 0,
    shippingTotal: 200,
    creditTotal: 0,
    discountUsages: [],
    ...overrides
  };
}

const applicable: ApplicableShippingMethods = {
  shippingMethods: [{ id: 1, name: 'Post', type: 'post' }],
  groupedShippingRates: {
    g1: [
      { id: 1, name: 'Post', price: 200 },
      { id: 2, name: 'Free', price: 0 }
    ]
  },
  // Only item 50 is shippable; item 51 (eBook) is digital.
  itemsShippingRate: [{ invoiceItemId: 50, shippingRate: { id: 1, name: 'Post', price: 200 } }]
};

describe('deriveShippingGroups', () => {
  it('builds a group of shippable items with switchable rates', () => {
    const groups = deriveShippingGroups(invoiceFixture(), applicable);
    expect(groups).toHaveLength(1);
    expect(groups[0].itemIds.map(String)).toEqual(['50']);
    expect(groups[0].rates.map((r) => r.id)).toEqual([1, 2]);
    expect(groups[0].selectedRateId).toBe(1); // default rate
  });

  it('reflects the currently assigned rate from the invoice', () => {
    const invoice = invoiceFixture({
      shippingItems: [{ invoiceItemIds: [50], rate: { id: 2, name: 'Free', price: 0 } }]
    });
    const groups = deriveShippingGroups(invoice, applicable);
    expect(groups[0].selectedRateId).toBe(2);
  });

  it('returns no groups for a digital-only invoice', () => {
    expect(deriveShippingGroups(invoiceFixture({ needsShipping: false }), applicable)).toEqual([]);
  });
});

describe('shipping assignment + completeness', () => {
  it('builds the API payload from selections', () => {
    const groups = deriveShippingGroups(invoiceFixture(), applicable);
    expect(buildShippingAssignments(groups)).toEqual([{ rateId: 1, invoiceItemIds: ['50'] }]);
  });

  it('treats digital invoices as already complete', () => {
    expect(isShippingComplete(invoiceFixture({ needsShipping: false }), [])).toBe(true);
  });
});

describe('digital items', () => {
  it('lists items that are not in any shipping group', () => {
    const groups = deriveShippingGroups(invoiceFixture(), applicable);
    const digital = selectDigitalItems(invoiceFixture(), groups, applicable);
    expect(digital.map((i) => i.id)).toEqual([51]);
  });
});

describe('selectSummary', () => {
  it('produces ordered lines and total', () => {
    const { lines, total } = selectSummary(invoiceFixture({
      shippingItems: [{ invoiceItemIds: [50], rate: { id: 1, name: 'Post', price: 200 } }]
    }));
    const keys = lines.map((l) => l.key);
    expect(keys).toContain('subtotal');
    expect(keys).toContain('discount');
    expect(keys).toContain('shipping');
    expect(total).toBe(1700);
    expect(lines.find((l) => l.key === 'discount')?.negative).toBe(true);
  });
});

describe('isAddressComplete', () => {
  const base = {
    firstName: 'A',
    lastName: 'B',
    mobilePhone: '0912',
    email: '',
    phoneNumber: '',
    regionId: null,
    cityId: null,
    postalCode: '',
    address: '',
    description: ''
  };

  it('requires region/city/address when shipping is needed', () => {
    expect(isAddressComplete(base, true)).toBe(false);
    expect(isAddressComplete({ ...base, regionId: 1, cityId: 2, address: 'x' }, true)).toBe(true);
  });

  it('requires postal code only when the checkout setting enables it', () => {
    const shippingAddress = { ...base, regionId: 1, cityId: 2, address: 'x' };
    expect(isAddressComplete(shippingAddress, true, true)).toBe(false);
    expect(isAddressComplete({ ...shippingAddress, postalCode: '1234567890' }, true, true)).toBe(true);
  });

  it('only requires contact for digital orders', () => {
    expect(isAddressComplete(base, false)).toBe(true);
  });
});

describe('classifyAppliedDiscount', () => {
  const before = invoiceFixture();

  it('detects a percentage code from a near-integer items delta', () => {
    // 10% off the 1,500 net items total (raw 1,700 − 200 item discounts).
    const after = invoiceFixture({ couponTotal: 150, finalTotal: 1550 });
    expect(classifyAppliedDiscount(before, after, 'TEN')).toEqual({
      code: 'TEN',
      kind: 'percentage',
      percent: 10,
      amount: 150,
      shippingSaved: 0
    });
  });

  it('detects a fixed amount code when the delta is not a round percent', () => {
    const after = invoiceFixture({ couponTotal: 123, finalTotal: 1577 });
    const result = classifyAppliedDiscount(before, after, 'FIX');
    expect(result.kind).toBe('fixed_amount');
    expect(result.amount).toBe(123);
  });

  it('detects a free shipping code when only the shipping total drops', () => {
    const after = invoiceFixture({ shippingTotal: 0, finalTotal: 1500 });
    expect(classifyAppliedDiscount(before, after, 'SHIPFREE')).toEqual({
      code: 'SHIPFREE',
      kind: 'free_shipping',
      amount: 0,
      shippingSaved: 200
    });
  });

  it('records shipping savings alongside an items discount', () => {
    const after = invoiceFixture({ couponTotal: 150, shippingTotal: 0, finalTotal: 1350 });
    const result = classifyAppliedDiscount(before, after, 'COMBO');
    expect(result.kind).toBe('percentage');
    expect(result.shippingSaved).toBe(200);
  });

  it('falls back to absolute totals when there is no before invoice', () => {
    const after = invoiceFixture({ couponTotal: 123, finalTotal: 1577 });
    const result = classifyAppliedDiscount(null, after, 'SAVED');
    expect(result.kind).toBe('fixed_amount');
    expect(result.amount).toBe(123);
    expect(result.shippingSaved).toBe(0);
  });

  it('is unknown when nothing measurable changed', () => {
    const result = classifyAppliedDiscount(before, invoiceFixture(), 'NOOP');
    expect(result).toEqual({ code: 'NOOP', kind: 'unknown', amount: 0, shippingSaved: 0 });
  });

  it('trusts an explicit backend type over the heuristics', () => {
    const after = invoiceFixture({
      couponTotal: 150,
      finalTotal: 1550,
      discountUsages: [{ discountCode: { code: 'X', discountType: 'fixed_amount' } }]
    } as unknown as Partial<Invoice>);
    expect(classifyAppliedDiscount(before, after, 'X').kind).toBe('fixed_amount');
  });
});
