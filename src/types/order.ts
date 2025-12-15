/**
 * Order-related types
 */

import { InvoiceItem, ShippingAddress } from './invoice';
import { PaymentMethod } from './payment';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  items: InvoiceItem[];
  shippingAddress?: ShippingAddress;
  paymentMethod?: PaymentMethod;

  // Financial details
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;

  trackingNumber?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}
