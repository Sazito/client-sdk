/**
 * Headless checkout orchestration types
 */

import type { Cart, SchedulerBookingAttributes } from './cart';
import type { Invoice, ShippingAddress } from './invoice';
import type { Order } from './order';
import type { Payment, PaymentAction, PaymentMethod, PaymentStepFormFields, PaymentStepInput } from './payment';
import type { ShippingAddressInput, ShippingAssignment } from './shipping';

export interface CheckoutItemAttributes {
  formAttributes?: Record<string, any>;
  schedulerBookingAttributes?: SchedulerBookingAttributes;
}

export interface CheckoutInitializeInput {
  variantId: number;
  count: number;
  attributes?: CheckoutItemAttributes;
  shippingAddress?: ShippingAddressInput;
  discountCode?: string;
  comment?: string;
  invoiceFormAttributes?: Record<string, any>;
  useWalletCredit?: boolean;
  paymentTypeId?: number;
}

export interface CheckoutSuccessPayload {
  order: Order;
  action: PaymentAction;
}

export interface CheckoutCallbacks {
  onSuccess?: (payload: CheckoutSuccessPayload) => void | Promise<void>;
}

export interface CheckoutInitializeResult {
  cart: Cart;
  invoice: Invoice;
  shippingAddress?: ShippingAddress;
  shippingAssignments: ShippingAssignment[];
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  payment: Payment;
  paymentAction: PaymentAction;
}

export interface CheckoutPaymentResult {
  paymentAction: PaymentAction;
  order?: Order;
}

export interface CheckoutPaymentStepInput extends PaymentStepInput {}
export type CheckoutPaymentStepFormInput = FormData | PaymentStepFormFields;
