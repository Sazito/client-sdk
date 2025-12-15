/**
 * Shipping-related types
 */


export interface ShippingMethod {
  id: number;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  isFree: boolean;
  isCourier: boolean;
  isPost: boolean;
}

export interface ShippingRate {
  id: number;
  shippingMethodId: number;
  cost: number;
  deliveryTime: string;
  minDays: number;
  maxDays: number;
}

export interface ShippingAddressInput {
  firstName: string;
  lastName: string;
  mobilePhone: string;
  phoneNumber?: string;
  email?: string;
  regionId: number;
  cityId: number;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  userSetCoordinatesBefore?: boolean;
}

export interface ShippingAddressCredentials {
  id: number;
  identifier: string;
}

export interface ShippingAssignment {
  rateId: number;
  invoiceItemIds: string[];
}
