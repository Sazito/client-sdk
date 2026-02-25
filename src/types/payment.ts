/**
 * Payment-related types
 */

import type { Order } from './order';
import type { JsonObject } from './common';

export type PaymentGateway =
  | 'mellatpayment'      // Bank Mellat
  | 'pecpayment'         // Parsian
  | 'sadadpayment'       // Sadad
  | 'zarinpalpayment'    // ZarinPal
  | 'paypingpayment'     // PayPing
  | 'podpayment'         // POD
  | 'uppayment'          // UP
  | 'seppayment'         // Sep
  | 'vandarpayment'      // Vandar
  | 'yourgatepayment'    // YourGate
  | 'bazarpayment'       // BazarPay
  | 'zifypayment'        // Zify
  | 'zibalpayment'       // Zibal
  | 'snapppayment'       // SnappPay
  | 'torobpaypayment'    // TorobPay
  | 'azkipayment'        // Azki
  | 'digipaypayment'     // DigiPay
  | 'novapaypayment'     // NovaPay
  | 'zarinpluspayment'   // ZarinPlus
  | 'tomanpayment'       // Toman
  | 'tarapayment'        // Tara
  | 'ozonpayment'        // Ozon
  | 'millipaypayment'    // MilliGold
  | 'ayriapayment'       // APG
  | 'sabinpayment'       // Sabin
  | 'paymentinplace'     // Pay on delivery
  | 'cardtocardpayment'  // Card to card
  | 'freepayment';       // Free (zero amount)

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaymentMethod {
  id: number;
  code: PaymentGateway;
  isDefault: boolean;
}

export interface Payment {
  id: number;
  identifier: string;
  paymentType: {
    id?: number;
    code: PaymentGateway;
  };
  amount: number;
}

export interface PaymentAction {
  action: 'POST' | 'REDIRECT' | 'UPLOAD' | 'pending' | 'showOrder' | 'StockViolated' | 'FAIL';
  address?: string;
  payload?: JsonObject;
  order?: Order;
  time?: number;
  message?: string;
}

export interface PaymentCredentials {
  id: number;
  identifier: string;
}

export interface CreatePaymentInput {
  invoiceId: number;
  invoiceIdentifier: string;
  paymentType: number;               // paymentType.id
}

export interface PaymentStepInput {
  id?: number;
  paymentIdentifier?: string;
  payload?: JsonObject;
  tatoken?: string;
  trackingData?: JsonObject;
  isFailed?: string;
  imageUrl?: string;
  code?: string;
}

export type PaymentStepFormValue = string | number | boolean | null | undefined;
export type PaymentStepFormFields = Record<string, PaymentStepFormValue>;
