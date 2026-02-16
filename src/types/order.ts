/**
 * Order-related types
 */

import { InvoiceItem } from './invoice';

export interface Order {
  id: number;
  orderNumber: string;
  orderIdentifier: string;
  invoice: {
    shippingItems: any[];
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
  filters?: Array<{ name: string; value: any }>;
}
