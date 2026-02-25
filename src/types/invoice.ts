/**
 * Invoice and checkout-related types
 */

import { Image, JsonObject, JsonValue, ProductAttribute } from './common';
import { SchedulerBookingAttributes, FormAttributeValue } from './cart';

export interface InvoiceItemFormAttributes {
  formId?: number;
  formData: Record<string, {
    label: string;
    value: JsonValue;
    type: string;
  }>;
}

export interface InvoiceItem {
  id: number | string;
  productVariantId: number;
  productId?: number;
  name: string;
  url?: string;
  attributes: ProductAttribute[];
  productType?: string;
  hasMaxOrder?: boolean;
  maxOrderQuantity?: number;
  minOrderQuantity?: number;
  image?: Image;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  rawPrice: number;
  customerProfit: number;
  commercialFiles?: JsonValue;
  formAttributes?: Record<string, FormAttributeValue> | InvoiceItemFormAttributes;
  bookingAttributes?: SchedulerBookingAttributes;
  formFields?: JsonObject;
}

export interface ShippingItem {
  invoiceItemIds: Array<number | string>;
  rate: {
    id: number;
    name: string;
    price: number;
    icon?: string;
    color?: string;
    type?: string;
  };
}

export interface ShippingAddressRegion {
  id: number;
  name: string;
}

export interface ShippingAddressCity {
  id: number;
  name: string;
  regionId?: number;
  latitude?: number;
  longitude?: number;
}

export interface ShippingAddress {
  id: number;
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: ShippingAddressRegion;
  city: ShippingAddressCity;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
}

export interface InvoiceShippingAddressRegion extends ShippingAddressRegion {
  city: ShippingAddressCity;
}

export interface InvoiceShippingAddress {
  identifier: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  phoneNumber?: string;
  email?: string;
  region?: InvoiceShippingAddressRegion;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
}

export interface User {
  id?: number;
  email?: string;
  mobilePhone?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

export interface Invoice {
  id: number;
  identifier: string;
  items: InvoiceItem[];
  shippingAddress?: InvoiceShippingAddress;
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
