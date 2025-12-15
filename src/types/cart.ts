/**
 * Cart-related types
 */

import { Image, ProductAttribute } from './common';

export interface CartProduct {
  id: number;                        // cartProductId
  product: {
    variantId: number;
    name: string;
    url: string;
    image: Image;
    attributes: ProductAttribute[];
    hasMaxOrder: boolean;
    maxOrderQuantity: number;
    minOrderQuantity: number;
  };
  unitPrice: number;
  lineTotal: number;
  quantity: number;
  formAttributes?: Record<string, any>;
  bookingAttributes?: {
    eventEntityId?: number;
    timezone?: string;
  };
  formFields?: Record<string, any>;
}

export interface Cart {
  id: number;
  identifier: string;         // Used for guest cart authentication
  items: CartProduct[];
  subtotal: number;                 // Subtotal before discounts/shipping
  total: number;               // After discounts, before shipping
  needsShipping: boolean;
  deleteCoupon: boolean;
}

export interface CartCredentials {
  id: number;
  identifier: string;
}

export interface AddToCartInput {
  id: number;                        // variantId
  count: number;
  formAttributes?: Record<string, any>;
  schedulerBookingAttributes?: {
    eventEntityId: number;
    timezone: string;
  };
}

export interface CreateCartInput {
  coupon?: string;
  variants: AddToCartInput[];
  formAttributes?: Record<string, any>;
  schedulerBookingAttributes?: {
    eventEntityId: number;
    timezone: string;
  };
}
