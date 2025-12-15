/**
 * Invoice and checkout-related types
 */

import { Image, ProductAttribute, Region, City } from './common';

export interface InvoiceItem {
  id: number;
  variant: {
    id: number;
    product: any;
    attributes: ProductAttribute[];
  };
  image: Image;
  name: string;
  unitPrice: number;
  lineTotal: number;
  quantity: number;
  formAttributes?: Record<string, any>;
  bookingAttributes?: Record<string, any>;
  formFields?: Record<string, any>;
}

export interface ShippingItem {
  invoiceItemIds: number[];
  rate: {
    id: number;
    shippingMethodId: number;
    cost: number;
    deliveryTime: string;
    minDays: number;
    maxDays: number;
  };
}

export interface ShippingAddress {
  id: number;
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone: string;
  phoneNumber?: string;
  email?: string;
  region: Region;
  city: City;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
}

export interface Invoice {
  id: number;
  identifier: string;
  items: InvoiceItem[];
  shippingAddress?: ShippingAddress;
  shippingItems: ShippingItem[];
  shippingMethod?: string;           // e.g., "postpaid", null
  needsShipping: boolean;
  user?: User;
  comment?: string;

  // Financial totals
  subtotal: number;                 // Subtotal
  total: number;               // After item discounts
  finalTotal: number;               // Final (after all discounts/shipping)
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;

  discountCode?: string;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCredentials {
  id: number;
  identifier: string;
}

export interface CreateInvoiceInput {
  cartId: number;
  cartIdentifier: string;
}

export interface RefreshInvoiceInput {
  cartId: number;
  cartIdentifier: string;
  identifier: string;
}
