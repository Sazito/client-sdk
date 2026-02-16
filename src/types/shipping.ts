/**
 * Shipping-related types
 */


export interface ShippingMethod {
  id: number;
  name: string;
  type: string;
}

export interface ShippingRate {
  id: number;
  name: string;
  price: number;
  icon?: string;
  color?: string;
  type?: string;
}

export interface ItemShippingRate {
  invoiceItemId: number;
  shippingRate: ShippingRate;
}

export interface ApplicableShippingMethods {
  shippingMethods: ShippingMethod[];
  groupedShippingRates: Record<string, ShippingRate[]>;
  itemsShippingRate: ItemShippingRate[];
}

export interface ShippingAddressInput {
  firstName: string;
  lastName: string;
  mobilePhone?: string;
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
  invoiceItemIds: number[];
}
