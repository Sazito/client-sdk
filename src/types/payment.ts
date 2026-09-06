/**
 * Payment-related types
 */

import type { CheckoutOrder } from './checkout-order';
import type { JsonObject, JsonValue, RequestOptions } from './common';

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
  /** Zero is valid for identifier-scoped v2 routes before gateway return. */
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
  /** Complete backend result before SDK normalization. */
  raw?: JsonObject;
}

export type PaymentAction = PaymentActionBase & (
  | { action: 'POST'; address: string; payload: Record<string, string | number> }
  | { action: 'REDIRECT'; address: string }
  | { action: 'UPLOAD'; time?: number }
  | { action: 'show_otp_modal'; time?: number }
  /** Successful payment; some deployments omit order details in the terminal response. */
  | { action: 'show_order'; order?: CheckoutOrder }
  | { action: 'pending'; order: CheckoutOrder }
  | { action: 'payment_fail_error' | 'show_error' | 'FAIL' }
  | { action: 'StockViolated' }
  | { action: 'unknown'; backendAction: string; raw: JsonObject }
);

export interface PaymentCredentials {
  /** Zero is valid for identifier-scoped v2 routes before gateway return. */
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

export type PaymentCallbackFieldValue = JsonValue | undefined;
export type PaymentCallbackFields = Record<string, PaymentCallbackFieldValue>;

/** Raw gateway callback accepted by the form-encoded verification request. */
export interface VerifyPaymentCallbackInput {
  paymentId: string | number;
  paymentIdentifier: string;
  /** Form/body fields are added first. */
  body?: PaymentCallbackFields;
  /** Query fields are added second and win when a name is duplicated. */
  query?: PaymentCallbackFields;
}

/** Controls the repeated JSON status check after a `pending` callback result. */
export interface PaymentPollingOptions extends RequestOptions {
  /** Delay before each request, including the first one. Defaults to 15 seconds. */
  intervalMs?: number;
  /** Overall polling deadline. Defaults to five minutes. */
  pollingTimeoutMs?: number;
  /** Optional maximum number of status requests. */
  maxAttempts?: number;
  /** Skip the initial delay when an immediate status check is desired. */
  immediate?: boolean;
}

export type PaymentStepFormValue = string | number | boolean | null | undefined;
export type PaymentStepFormFields = Record<string, PaymentStepFormValue>;
