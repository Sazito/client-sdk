/**
 * Invoice and checkout-related types
 */

import { CheckoutProductSnapshot, Image, Region, City } from './common';
import { SchedulerBookingAttributes, FormAttributeValue } from './cart';

export interface InvoiceItemFormAttributes {
  formId?: number;
  formData: Record<string, {
    label: string;
    value: any;
    type: string;
  }>;
}

export interface InvoiceItem {
  id: number;
  productVariantId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  rawPrice: number;
  customerProfit: number;
  image: Image;
  product: CheckoutProductSnapshot;
  commercialFiles?: any;
  formAttributes?: Record<string, FormAttributeValue> | InvoiceItemFormAttributes;
  bookingAttributes?: SchedulerBookingAttributes;
  formFields?: Record<string, any>;
}

export interface ShippingItem {
  invoiceItemIds: number[];
  rate: {
    id: number;
    name: string;
    price: number;
    icon?: string;
    color?: string;
    type?: string;
  };
}

export interface ShippingAddress {
  id: number;
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: Region;
  city: City;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id?: number;
  email?: string;
  mobilePhone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

export interface Invoice {
  id: number;
  identifier: string;
  items: InvoiceItem[];
  shippingAddress?: ShippingAddress;
  shippingItems: ShippingItem[];
  needsShipping: boolean;
  userComment?: string;
  netTotal: number;
  finalTotal: number;
  vat: number;
  vatPercent: number;
  itemsDiscount: number;
  discountTotal: number;
  customerProfit: number;
  customerProfitPercentage: number;
  itemsTotalRawPrice: number;
  couponTotal: number;
  shippingTotal: number;
  creditTotal: number;
  user?: User;
  discountUsages: Array<{
    discountCode: {
      code: string;
      userSegment?: string;
    };
  }>;
  coupon?: {
    userSegment?: string;
  };
  discountCode?: string;
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
