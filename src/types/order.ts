/**
 * Order-related types
 */

import { JsonObject, JsonValue } from './common';
import type { InvoiceItem } from './invoice';

export type OrderPublicId = number | string;

/** Account order item; retained as an alias for existing imports. */
export type OrderInvoiceItem = InvoiceItem;

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
  invoiceItems: InvoiceItem[];
  shippingItems: JsonObject[];
  netTotal?: number;
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

export interface Order {
  id: number;
  orderNumber: string;
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
