/**
 * Cart-related types
 */

import { CheckoutProductSnapshot, JsonObject } from './common';

export interface SchedulerBookingAttributes {
  eventEntityId: string | number;
  eventTitle?: string;
  eventId?: string;
  startDateTimeLocal: string;
  endDateTimeLocal: string;
  timezone: string;
}

export interface UploadedFormFileAttribute {
  serveKey: string;
  fileName: string;
}

export type FormAttributeValue = string | number | boolean | null | UploadedFormFileAttribute;

export interface CartProduct {
  id: number | string;
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: CheckoutProductSnapshot;
  formAttributes?: Record<string, FormAttributeValue>;
  formFields?: JsonObject;
  bookingAttributes?: SchedulerBookingAttributes;
}

export interface Cart {
  id: number;
  identifier: string;
  items: CartProduct[];
  netTotal: number;
  grossTotal?: number;
  needsShipping: boolean;
  minBasketLimitViolated: boolean;
  deleteCoupon?: boolean;
}

export interface CartCredentials {
  id: number;
  identifier: string;
}

export interface AddToCartInput {
  id: number;
  count: number;
  formAttributes?: Record<string, FormAttributeValue>;
}

export interface CreateCartInput {
  coupon?: string;
  variants: AddToCartInput[];
  formAttributes?: Record<string, FormAttributeValue>;
  schedulerBookingAttributes?: SchedulerBookingAttributes;
}
