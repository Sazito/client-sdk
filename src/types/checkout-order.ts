/**
 * Payment completion order from process_payment_step; independent of account Order.
 */

import type { OrderPublicId } from './order';

export interface CheckoutInvoiceItem {
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
    price: number;
    type?: string;
    icon?: string;
    color?: string;
  };
}

export interface CheckoutInvoice {
  invoiceItems: CheckoutInvoiceItem[];
  shippingItems: CheckoutShippingItem[];
  netTotal: number;
  finalTotal: number;
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
