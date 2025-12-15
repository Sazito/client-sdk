/**
 * Payment-related types
 */

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
  name: string;
  description: {
    description: string;
    cardNumber?: string;             // For card-to-card
    cardDescription?: string;
    uploadNeeded?: boolean;
  };
  enabled: boolean;
  config?: Record<string, any>;
}

export interface Payment {
  id: number;
  identifier: string;
  paymentType: PaymentMethod;
  amount: number;
  invoiceId: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAction {
  action: 'POST' | 'REDIRECT' | 'UPLOAD' | 'FAIL' | 'StockViolated';
  address?: string;                   // Gateway URL
  payload?: Record<string, any>;      // POST data
  time?: number;                      // For upload deadline
  message?: string;                   // Error message
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
  identifier: string;
  isFailed?: string;                 // "true" to mark as failed
  imageUrl?: string;                 // For card-to-card
  code?: string;                      // For card-to-card verification
}
