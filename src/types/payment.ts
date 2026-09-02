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
  /** Backend display title (English). */
  title: string;
  /** Backend display title (Persian). */
  titleFa: string;
  /** Backend description; often null. */
  description: string | null;
  /** Backend payment sub-type id; null when not provided. */
  paymentSubType: number | null;
  /** Display order from backend. */
  order: number;
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

interface PaymentActionBase {
  message?: string;
}

export type PaymentAction = PaymentActionBase & (
  | { action: 'POST'; address: string; payload: Record<string, string | number> }
  | { action: 'REDIRECT'; address: string }
  | { action: 'UPLOAD'; time?: number }
  | { action: 'show_otp_modal'; time?: number }
  | { action: 'show_order'; order: Order }
  | { action: 'pending'; order: Order }
  | { action: 'payment_fail_error' | 'show_error' | 'FAIL' }
  | { action: 'StockViolated' }
);

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
  /** Payment ID supplied by Sazito's gateway-return path. */
  id?: number;
  /** Payment identifier supplied by Sazito's gateway-return path. */
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
