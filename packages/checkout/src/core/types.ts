/**
 * Checkout domain types.
 *
 * The package re-exports the SDK data models (camelCase) and layers
 * checkout-specific state, config, events and effects on top.
 */
import type {
  Cart,
  CartProduct,
  Invoice,
  InvoiceItem,
  InvoiceShippingAddress,
  ShippingItem,
  ShippingMethod,
  ShippingRate,
  ApplicableShippingMethods,
  ItemShippingRate,
  ShippingAddress,
  ShippingAddressInput,
  ShippingAssignment,
  PaymentMethod,
  PaymentAction,
  PaymentGateway,
  Order,
  CheckoutOrder,
  CheckoutInvoice,
  CheckoutInvoiceItem,
  CheckoutShippingItem,
  OrderInvoice,
  OrderInvoiceItem,
  OrderShippingItem,
  OrderPublicId
} from '@sazito/client-sdk';

export type {
  Cart,
  CartProduct,
  Invoice,
  InvoiceItem,
  InvoiceShippingAddress,
  ShippingItem,
  ShippingMethod,
  ShippingRate,
  ApplicableShippingMethods,
  ItemShippingRate,
  ShippingAddress,
  ShippingAddressInput,
  ShippingAssignment,
  PaymentMethod,
  PaymentAction,
  PaymentGateway,
  Order,
  CheckoutOrder,
  CheckoutInvoice,
  CheckoutInvoiceItem,
  CheckoutShippingItem,
  OrderInvoice,
  OrderInvoiceItem,
  OrderShippingItem,
  OrderPublicId
};

/** How a discount code changes the order. */
export type DiscountKind = 'percentage' | 'fixed_amount' | 'free_shipping' | 'unknown';

/**
 * A successfully applied discount code with its detected type. The API only
 * reports discount codes as totals on the invoice, so the type is inferred by
 * `classifyAppliedDiscount` (selectors) — `unknown` when nothing measurable
 * changed yet (e.g. a free-shipping code applied before a rate is selected).
 */
export interface AppliedDiscount {
  code: string;
  kind: DiscountKind;
  /** Amount taken off the items total by this code. */
  amount: number;
  /** Percentage discounts only: the detected integer percent. */
  percent?: number;
  /** Shipping cost removed by the code. */
  shippingSaved?: number;
}

/** Regions are not re-exported by the SDK top level; mirror the shape here. */
export interface CheckoutCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface CheckoutRegion {
  id: number;
  name: string;
  cities: CheckoutCity[];
}

export type CheckoutLocale = 'fa' | 'en';
export type CheckoutDirection = 'rtl' | 'ltr';

/** Interactive steps in order. `result` is the terminal post-payment screen. */
export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'result';

/** Coarse engine status used to drive spinners / disabled states. */
export type CheckoutStatus =
  | 'idle'
  | 'bootstrapping'
  | 'working'
  | 'redirecting'
  | 'polling'
  | 'error';

export type CheckoutResultStatus = 'success' | 'failed' | 'pending' | 'stock_violated';

export interface CheckoutTheme {
  /** Primary accent (buttons, active states). CSS color. */
  accent?: string;
  /** Foreground used on top of the accent. CSS color. */
  accentForeground?: string;
  /** Soft accent surface used for selected rows and focus-adjacent states. */
  accentSoft?: string;
  /** Checkout page background. */
  background?: string;
  /** Primary text color. */
  foreground?: string;
  /** Muted surface background. */
  muted?: string;
  /** Secondary text color. */
  mutedForeground?: string;
  /** Borders and dividers. */
  border?: string;
  /** Form, product, and shipping card background. */
  card?: string;
  /** Order-summary sidebar background. */
  summaryBackground?: string;
  /** Error and destructive-state color. */
  danger?: string;
  /** Success and completed-state color. */
  success?: string;
  /** Foreground used on top of solid success surfaces. */
  successForeground?: string;
  /** Background plate behind carrier and shipping-method logos. */
  logoBackground?: string;
  /** Neutral surface used when a shipping color is white or near-white. */
  shippingNeutral?: string;
  /** Foreground used on the neutral shipping surface. */
  shippingNeutralForeground?: string;
  /** Base corner radius in px. */
  radius?: number;
  /** Font family. Defaults to `inherit` so the host font flows through. */
  fontFamily?: string;
}

/** Seed credentials so checkout can attach to an already-built cart. */
export interface CheckoutCredentials {
  cart?: { id?: number; identifier: string };
  invoice?: { id: number; identifier: string };
  payment?: { id: number; identifier: string };
}

/** Normalized payment callback data accepted by `SazitoCheckoutPage`. */
export interface CheckoutPaymentReturn {
  payment: { id: number; identifier: string };
  params: Record<string, string>;
}

/** Search-param shape exposed by current Next.js App Router pages. */
export type PaymentReturnSearchParams = Record<
  string,
  string | string[] | undefined
>;

export interface CheckoutConfig {
  locale?: CheckoutLocale;
  direction?: CheckoutDirection;
  theme?: CheckoutTheme;
  /** URL for the "continue shopping" / back-to-store action. */
  continueShoppingUrl?: string;
  /**
   * Reserved for gateways that support a caller-provided return URL.
   * Current Sazito legacy callbacks use their generated nested result path.
   * @deprecated Use an optional catch-all route with `parsePaymentReturn`.
   */
  returnUrl?: string;
  /** Pending-payment poll interval in ms (default 15000). */
  pollIntervalMs?: number;
  /** Currency label override (defaults per-locale). */
  currencyLabel?: string;
  onEvent?: (event: CheckoutEvent) => void;
}

/** The guest contact + address form. */
export interface AddressFormValues {
  firstName: string;
  lastName: string;
  mobilePhone: string;
  email: string;
  phoneNumber: string;
  regionId: number | null;
  cityId: number | null;
  postalCode: string;
  address: string;
  description: string;
}

/**
 * A shippable group: a set of invoice items shipped together, with the rates
 * the customer can switch between and the currently selected rate.
 */
export interface ShippingGroup {
  key: string;
  title: string;
  itemIds: Array<number | string>;
  items: InvoiceItem[];
  rates: ShippingRate[];
  selectedRateId: number | null;
}

export interface CheckoutResult {
  status: CheckoutResultStatus;
  order?: CheckoutOrder;
  message?: string;
}

export interface CheckoutError {
  message: string;
  code?: CheckoutErrorCode;
  status?: number;
  step?: CheckoutStep;
}

export type CheckoutErrorCode =
  | 'no_cart'
  | 'no_invoice'
  | 'min_basket'
  | 'rate_limited'
  | 'cart_invalid'
  | 'invoice_locked'
  | 'stock_violated'
  | 'shipping_required'
  | 'address_required'
  | 'payment_failed'
  | 'network'
  | 'validation'
  | 'unknown';

/** Per-region async flags so the UI can show targeted spinners. */
export interface CheckoutFlags {
  bootstrapping: boolean;
  updatingCart: boolean;
  savingAddress: boolean;
  loadingShipping: boolean;
  selectingRate: boolean;
  applyingDiscount: boolean;
  loadingPayments: boolean;
  placingOrder: boolean;
}

export interface CheckoutState {
  step: CheckoutStep;
  status: CheckoutStatus;
  locale: CheckoutLocale;
  direction: CheckoutDirection;

  cart: Cart | null;
  invoice: Invoice | null;
  regions: CheckoutRegion[];

  addressForm: AddressFormValues;
  /** Shop-level requirement loaded from the checkout configuration. */
  postalCodeMandatory: boolean;
  /** Shop-level requirement loaded from the checkout configuration. */
  emailMandatory: boolean;
  /** Whether the saved address on the invoice matches the current form. */
  addressDirty: boolean;

  applicable: ApplicableShippingMethods | null;
  shippingGroups: ShippingGroup[];

  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: number | null;

  discountCode: string;
  appliedDiscountCode: string | null;
  /** Type + saved amounts of the applied code; null when no code is applied. */
  appliedDiscount: AppliedDiscount | null;
  /** Inline error for the discount field; not shown in the global banner. */
  discountError: string | null;

  result: CheckoutResult | null;
  error: CheckoutError | null;
  flags: CheckoutFlags;
}

export type CheckoutEventName =
  | 'checkout_viewed'
  | 'step_viewed'
  | 'address_submitted'
  | 'shipping_rate_selected'
  | 'discount_applied'
  | 'discount_removed'
  | 'payment_method_selected'
  | 'payment_initiated'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_pending';

export interface CheckoutEvent {
  name: CheckoutEventName;
  step?: CheckoutStep;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Side-effects the pure engine asks the host to perform. The default browser
 * executor handles all of these; a host may override (SSR / native / tests).
 */
export type CheckoutEffect =
  | { type: 'redirect'; url: string }
  | { type: 'post-form'; url: string; fields: Record<string, string> }
  | { type: 'emit'; event: CheckoutEvent };

export type CheckoutEffectExecutor = (effect: CheckoutEffect) => void;

/** Options for constructing the engine. */
export interface CheckoutEngineOptions {
  client?: unknown;
  credentials?: CheckoutCredentials;
  config?: CheckoutConfig;
}

/** Public command surface exposed to UI bindings. */
export interface CheckoutActions {
  /** Load cart + invoice and derive initial state. */
  start(): Promise<void>;
  goToStep(step: CheckoutStep): void;
  next(): Promise<void>;
  back(): void;

  /** Cart review edits — update a line quantity or remove a line. */
  updateItemQuantity(cartProductId: number | string, variantId: number, quantity: number): Promise<void>;
  removeItem(cartProductId: number | string, variantId: number): Promise<void>;

  setAddressField<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]): void;
  submitAddress(): Promise<boolean>;

  selectShippingRate(groupKey: string, rateId: number): Promise<void>;

  setDiscountCode(code: string): void;
  applyDiscount(): Promise<void>;
  removeDiscount(): Promise<void>;

  selectPaymentMethod(id: number): void;

  placeOrder(): Promise<void>;
  /** Resolve a return from the payment gateway (query params from the URL). */
  resolvePaymentReturn(params: Record<string, string>): Promise<void>;

  reset(): void;
}
