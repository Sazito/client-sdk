/**
 * Order-related types
 */

import { InvoiceItem } from './invoice';
import { JsonObject, JsonValue } from './common';

export interface Order {
  id: number;
  orderNumber: string;
  orderIdentifier: string;
  invoice: {
    shippingItems: JsonObject[];
    invoiceItems: InvoiceItem[];
  };
}

export interface OrdersListResponse {
  orders: Order[];
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
