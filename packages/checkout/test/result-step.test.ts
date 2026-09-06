import { describe, expect, it } from 'vitest';
import type { CheckoutInvoiceItem, CheckoutShippingItem } from '../src/core';
import { groupResultItemsByShipping } from '../src/ui/steps/ResultStep';

function makeItem(id: number, name: string): CheckoutInvoiceItem {
  return {
    id,
    productVariantId: id + 100,
    name,
    variantAttributes: [],
    singleItemPrice: 100,
    noOfItems: 1,
    totalItemsPrice: 100,
    productVariant: { product: { productType: 'physical' } }
  };
}

function makeShipping(
  id: number,
  name: string,
  invoiceItemIds: number[]
): CheckoutShippingItem {
  return {
    id,
    invoiceItemIds,
    rate: { name, price: 0 }
  };
}

describe('result item shipping groups', () => {
  it('puts each product under its assigned shipping method', () => {
    const postItem = makeItem(11, 'Post item');
    const courierItem = makeItem(12, 'Courier item');
    const digitalItem = makeItem(13, 'Download');

    const grouped = groupResultItemsByShipping(
      [postItem, courierItem, digitalItem],
      [makeShipping(1, 'Post', [11]), makeShipping(2, 'Courier', [12])]
    );

    expect(grouped.shipmentGroups).toEqual([
      { shipping: expect.objectContaining({ id: 1 }), items: [postItem] },
      { shipping: expect.objectContaining({ id: 2 }), items: [courierItem] }
    ]);
    expect(grouped.unassignedItems).toEqual([digitalItem]);
  });

  it('groups legacy items under the only unambiguous shipping method', () => {
    const legacyItem = { ...makeItem(21, 'Legacy item'), id: undefined };
    const shipping = makeShipping(3, 'Post', []);

    expect(groupResultItemsByShipping([legacyItem], [shipping])).toEqual({
      shipmentGroups: [{ shipping, items: [legacyItem] }],
      unassignedItems: []
    });
  });
});
