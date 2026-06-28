/**
 * Pure derivations over invoice / shipping data: shipping groups, summary
 * lines, address form mapping and validation. No SDK calls, no side-effects.
 */
import type {
  AddressFormValues,
  ApplicableShippingMethods,
  CheckoutRegion,
  Invoice,
  InvoiceItem,
  ShippingAssignment,
  ShippingGroup,
  ShippingRate
} from './types';

const idStr = (value: number | string): string => String(value);

export function emptyAddressForm(): AddressFormValues {
  return {
    firstName: '',
    lastName: '',
    mobilePhone: '',
    email: '',
    phoneNumber: '',
    regionId: null,
    cityId: null,
    postalCode: '',
    address: '',
    description: ''
  };
}

/**
 * After regions load, the city ID stored in the invoice address may not match
 * any city in the regions list (different ID schemes). Try to match by city
 * name; if no match, reset cityId so the user can pick again.
 */
export function reconcileAddressWithRegions(
  form: AddressFormValues,
  regions: CheckoutRegion[],
  savedCityName?: string
): AddressFormValues {
  if (form.regionId == null) return form;
  const region = regions.find((r) => r.id === form.regionId);
  if (!region) return { ...form, regionId: null, cityId: null };
  if (form.cityId != null && region.cities.some((c) => c.id === form.cityId)) {
    return form; // already valid
  }
  if (savedCityName) {
    const match = region.cities.find((c) => c.name === savedCityName);
    if (match) return { ...form, cityId: match.id };
  }
  return { ...form, cityId: null };
}

export function addressFormFromInvoice(invoice: Invoice | null): AddressFormValues {
  const base = emptyAddressForm();
  const addr = invoice?.shippingAddress;
  if (!addr) {
    return base;
  }
  return {
    firstName: addr.firstName ?? '',
    lastName: addr.lastName ?? '',
    mobilePhone: addr.mobilePhone ?? '',
    email: addr.email ?? '',
    phoneNumber: addr.phoneNumber ?? '',
    regionId: addr.region?.id ?? null,
    cityId: addr.region?.city?.id ?? null,
    postalCode: addr.postalCode ?? '',
    address: addr.address ?? '',
    description: addr.description ?? ''
  };
}

export function isAddressComplete(
  form: AddressFormValues,
  needsShipping: boolean,
  postalCodeMandatory = false,
  emailMandatory = false
): boolean {
  const hasContact =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.mobilePhone.trim() !== '' &&
    (!emailMandatory || form.email.trim() !== '');
  if (!needsShipping) {
    return hasContact;
  }
  return (
    hasContact &&
    form.regionId != null &&
    form.cityId != null &&
    (!postalCodeMandatory || form.postalCode.trim() !== '') &&
    form.address.trim() !== ''
  );
}

/** Has the form diverged from what's saved on the invoice? */
export function isAddressDirty(form: AddressFormValues, invoice: Invoice | null): boolean {
  const saved = addressFormFromInvoice(invoice);
  return (Object.keys(form) as Array<keyof AddressFormValues>).some(
    (key) => form[key] !== saved[key]
  );
}

function uniqueRates(rates: ShippingRate[]): ShippingRate[] {
  const seen = new Set<number>();
  const out: ShippingRate[] = [];
  for (const rate of rates) {
    if (!seen.has(rate.id)) {
      seen.add(rate.id);
      out.push(rate);
    }
  }
  return out;
}

/**
 * Group invoice items into shippable bundles with their switchable rates and
 * the currently selected rate. Digital-only invoices yield an empty list.
 *
 * The Sazito API returns:
 *   groupedShippingRates  — all applicable rates per "bundle" (keyed by group ID)
 *   itemsShippingRate     — one entry per item with its DEFAULT/current rate
 *
 * The default rate ID in itemsShippingRate may NOT match any rate in
 * groupedShippingRates (different IDs for the same method type). We therefore
 * assign items by the currently ASSIGNED rate from invoice.shippingItems first,
 * then fall back to the default rate, and finally use positional assignment
 * (all physical items in the single group when there is only one group).
 */
export function deriveShippingGroups(
  invoice: Invoice | null,
  applicable: ApplicableShippingMethods | null
): ShippingGroup[] {
  if (!invoice || !invoice.needsShipping || !applicable) {
    return [];
  }

  const itemById = new Map<string, InvoiceItem>(
    invoice.items.map((item) => [idStr(item.id), item])
  );

  // Exclude digital items — they never go through physical shipping groups.
  const physicalItemsRate = (applicable.itemsShippingRate ?? []).filter((isr) => {
    const item = itemById.get(idStr(isr.invoiceItemId));
    return !item || item.productType !== 'digital';
  });

  if (physicalItemsRate.length === 0) return [];

  const physicalItemIds = physicalItemsRate.map((isr) => idStr(isr.invoiceItemId));

  // item -> currently assigned rate id (from the saved invoice assignment)
  const assignedRateById = new Map<string, number>();
  for (const si of invoice.shippingItems ?? []) {
    for (const itemId of si.invoiceItemIds) {
      assignedRateById.set(idStr(itemId), si.rate.id);
    }
  }

  // item -> default rate from applicable methods
  const defaultRateByItem = new Map<string, ShippingRate>();
  for (const isr of physicalItemsRate) {
    defaultRateByItem.set(idStr(isr.invoiceItemId), isr.shippingRate);
  }

  const resolveItems = (ids: string[]) =>
    ids.map((id) => itemById.get(id)).filter((i): i is InvoiceItem => Boolean(i));

  // Pick selected rate: prefer the saved assignment if it's in the group's rates,
  // otherwise use the default, otherwise the first rate.
  const resolveSelected = (itemIds: string[], rates: ShippingRate[]): number | null => {
    const rateSet = new Set(rates.map((r) => r.id));
    for (const id of itemIds) {
      const assigned = assignedRateById.get(id);
      if (assigned != null && rateSet.has(assigned)) return assigned;
    }
    for (const id of itemIds) {
      const def = defaultRateByItem.get(id);
      if (def && rateSet.has(def.id)) return def.id;
    }
    // assigned or default rate isn't in this group's rate list — still prefer it
    for (const id of itemIds) {
      const assigned = assignedRateById.get(id);
      if (assigned != null) return assigned;
    }
    return rates[0]?.id ?? null;
  };

  const groupedEntries = Object.entries(applicable.groupedShippingRates ?? {});

  // Single group → all physical items belong to it, show ALL its rates.
  if (groupedEntries.length === 1) {
    const [key, rates] = groupedEntries[0];
    const allRates = uniqueRates(rates);
    return [
      {
        key,
        title: '',
        itemIds: physicalItemIds,
        items: resolveItems(physicalItemIds),
        rates: allRates,
        selectedRateId: resolveSelected(physicalItemIds, allRates)
      }
    ];
  }

  // Multiple groups — try to assign items by assigned/default rate membership.
  if (groupedEntries.length > 1) {
    const groups: ShippingGroup[] = [];
    for (const [key, rates] of groupedEntries) {
      const rateSet = new Set(rates.map((r) => r.id));
      const itemIds = physicalItemsRate
        .filter((isr) => {
          const itemId = idStr(isr.invoiceItemId);
          const assigned = assignedRateById.get(itemId);
          return (assigned != null && rateSet.has(assigned)) || rateSet.has(isr.shippingRate.id);
        })
        .map((isr) => idStr(isr.invoiceItemId));
      if (itemIds.length === 0) continue;
      const allRates = uniqueRates(rates);
      groups.push({
        key,
        title: '',
        itemIds,
        items: resolveItems(itemIds),
        rates: allRates,
        selectedRateId: resolveSelected(itemIds, allRates)
      });
    }
    if (groups.length > 0) return groups;
  }

  // Fallback: one group with all physical items and ALL rates from every group.
  const allRates = uniqueRates([
    ...Object.values(applicable.groupedShippingRates ?? {}).flat(),
    ...physicalItemsRate.map((isr) => isr.shippingRate)
  ]);
  return [
    {
      key: 'all',
      title: 'shipping',
      itemIds: physicalItemIds,
      items: resolveItems(physicalItemIds),
      rates: allRates,
      selectedRateId: resolveSelected(physicalItemIds, allRates)
    }
  ];
}

/** Build the API payload from the current group selections. */
export function buildShippingAssignments(groups: ShippingGroup[]): ShippingAssignment[] {
  return groups
    .filter((group) => group.selectedRateId != null)
    .map((group) => ({
      rateId: group.selectedRateId as number,
      invoiceItemIds: group.itemIds
    }));
}

/** True once every shippable group has a selected rate. */
export function isShippingComplete(invoice: Invoice | null, groups: ShippingGroup[]): boolean {
  if (!invoice?.needsShipping) {
    return true;
  }
  if (groups.length === 0) {
    return false;
  }
  return groups.every((group) => group.selectedRateId != null);
}

export type SummaryLineKey = 'subtotal' | 'discount' | 'shipping' | 'credit' | 'vat';

export interface SummaryLine {
  key: SummaryLineKey;
  amount: number;
  negative?: boolean;
  free?: boolean;
  /** Discount line only: amount as a percentage of subtotal (rounded). */
  percent?: number;
}

export interface CheckoutSummary {
  lines: SummaryLine[];
  total: number;
}

export function selectSummary(invoice: Invoice | null): CheckoutSummary {
  if (!invoice) {
    return { lines: [], total: 0 };
  }

  const subtotal = invoice.itemsTotalRawPrice || invoice.netTotal || 0;
  const discount =
    (invoice.itemsDiscount || 0) + (invoice.discountTotal || 0) + (invoice.couponTotal || 0);

  const lines: SummaryLine[] = [{ key: 'subtotal', amount: subtotal }];

  if (discount > 0) {
    // Backend savings percentage for the "your savings" line; fall back to amount/subtotal.
    // Keep it fractional — a 5,000 discount on a 23M order is ~0.02%, not 0.
    const percent =
      (invoice.customerProfitPercentage || 0) > 0
        ? invoice.customerProfitPercentage
        : subtotal > 0
          ? (discount / subtotal) * 100
          : 0;
    lines.push({ key: 'discount', amount: discount, negative: true, percent });
  }
  // Only show shipping line once a method has been assigned.
  if (invoice.needsShipping && (invoice.shippingItems?.length ?? 0) > 0) {
    lines.push({ key: 'shipping', amount: invoice.shippingTotal || 0, free: !invoice.shippingTotal });
  }
  if ((invoice.creditTotal || 0) > 0) {
    lines.push({ key: 'credit', amount: invoice.creditTotal, negative: true });
  }
  if ((invoice.vat || 0) > 0) {
    lines.push({ key: 'vat', amount: invoice.vat, percent: Math.round(invoice.vatPercent || 0) });
  }

  return { lines, total: invoice.finalTotal || 0 };
}

/** Items that don't require shipping (digital), for display in the shipping step. */
export function selectDigitalItems(
  invoice: Invoice | null,
  groups: ShippingGroup[],
  applicable: ApplicableShippingMethods | null
): InvoiceItem[] {
  if (!invoice) return [];
  if (!invoice.needsShipping) return invoice.items;
  // Before shipping methods are loaded, only explicitly-digital items are known.
  // Showing everything as "digital" when applicable is null would be wrong.
  if (applicable == null) {
    return invoice.items.filter((item) => item.productType === 'digital');
  }
  // After shipping methods load: items absent from all groups are non-shippable.
  const shippable = new Set(groups.flatMap((g) => g.itemIds.map(idStr)));
  return invoice.items.filter((item) => !shippable.has(idStr(item.id)));
}
