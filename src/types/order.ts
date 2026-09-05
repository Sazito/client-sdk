/**
 * Order-related types
 */

import { JsonValue } from './common';
import type { InvoiceItem } from './invoice';

export type OrderPublicId = number | string;

/**
 * Keeps the established InvoiceItem contract for patch-level compatibility,
 * while exposing direct camelCase checkout fields when the endpoint provides them.
 */
export interface OrderInvoiceItem extends InvoiceItem {
  variantAttributes?: Array<{
    name: string;
    value: string;
  }>;
  singleItemPrice?: number;
  noOfItems?: number;
  totalItemsPrice?: number;
  productVariant?: {
    commercialFiles?: Array<{ id: OrderPublicId }>;
    product: {
      productType: string;
    };
  };
}

export interface OrderShippingItem {
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

export interface OrderInvoice {
  invoiceItems: OrderInvoiceItem[];
  shippingItems: OrderShippingItem[];
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

export interface Order {
  id: OrderPublicId;
  orderNumber: OrderPublicId;
  orderIdentifier: string;
  invoice: OrderInvoice;
}

export interface OrdersListResponse {
  orders: Order[];
  pageNumber?: number;
  pageSize?: number;
  totalCount: number;
  totalCountRaw: number;
  totalNotSeen: number;
  totalSeen: number;
}

export interface OrderFilters {
  pageNumber?: number;
  pageSize?: number;
  filters?: Array<{ name: string; value: JsonValue }>;
}
