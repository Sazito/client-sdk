/**
 * Payment completion order from process_payment_step; independent of account Order.
 */

import type { OrderPublicId } from './order';

export interface CheckoutInvoiceItem {
  /** Invoice-line identifier used to associate this item with a shipment. */
  id?: OrderPublicId;
  productVariantId: OrderPublicId;
  name: string;
  image?: { url?: string };
  variantAttributes: Array<{
    name: string;
    value: string;
  }>;
  singleItemPrice: number;
  noOfItems: number;
  totalItemsPrice: number;
  customerProfit?: number;
  formAttributes?: unknown;
  bookingAttributes?: unknown;
  productVariant: {
    commercialFiles?: Array<{ id: OrderPublicId }>;
    product: {
      productType: string;
    };
  };
}

export interface CheckoutShippingItem {
  id: OrderPublicId;
  invoiceItemIds: OrderPublicId[];
  rate: {
    id?: OrderPublicId;
    name: string;
    description?: string;
    price: number;
    type?: string;
    icon?: string;
    color?: string;
  };
}

export interface CheckoutInvoice {
  invoiceItems: CheckoutInvoiceItem[];
  shippingItems: CheckoutShippingItem[];
  /** May be omitted by the payment verification response. */
  netTotal?: number;
  /** May be omitted by the payment verification response. */
  finalTotal?: number;
  shippingTotal?: number;
  discountTotal?: number;
  creditTotal?: number;
  vat?: number;
  vatPercent?: number;
  itemsTotalRawPrice?: number;
  itemsDiscount?: number;
  customerProfit?: number;
  customerProfitPercentage?: number;
  discountUsages?: Array<{
    discountCode?: { code?: string };
  }>;
}

export interface CheckoutOrder {
  id: OrderPublicId;
  orderNumber: OrderPublicId;
  orderIdentifier: string;
  invoice: CheckoutInvoice;
}
