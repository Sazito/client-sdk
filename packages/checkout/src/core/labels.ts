/**
 * UI strings (fa/en) and domain label helpers (payment gateways, shipping).
 */
import type { CheckoutLocale, PaymentGateway } from './types';

export interface Strings {
  // steps
  stepCart: string;
  stepShipping: string;
  stepPayment: string;
  stepReview: string;
  stepResult: string;
  /** Mobile header title for the shipping step. */
  stepShippingInfo: string;
  /** Mobile header progress, e.g. "مرحله ۲ از ۳" / "Step 2 of 3". */
  stepOf: (current: string, total: string) => string;
  // common
  next: string;
  placeOrder: string;
  saveShippingDetails: string;
  continueToPayment: string;
  finalizeOrder: string;
  finishPurchase: string;
  back: string;
  continueShopping: string;
  orderSummary: string;
  subtotal: string;
  shipping: string;
  discount: string;
  credit: string;
  vat: string;
  total: string;
  totalAmount: string;
  free: string;
  quantity: string;
  optional: string;
  // cart
  cartTitle: string;
  cartEmpty: string;
  cartEmptyHint: string;
  remove: string;
  itemDiscount: (amount: string) => string;
  yourSavings: string;
  // shipping / address
  contactInfo: string;
  firstName: string;
  lastName: string;
  mobilePhone: string;
  email: string;
  phoneNumber: string;
  region: string;
  city: string;
  postalCode: string;
  addressLine: string;
  description: string;
  selectRegion: string;
  selectCity: string;
  shippingMethod: string;
  shippingMethods: string;
  shippingMethodsHint: string;
  digitalNoShipping: string;
  digitalNoShippingHint: string;
  // validation errors
  errorRequired: string;
  errorMobilePhone: string;
  errorEmail: string;
  changeTo: string;
  productCount: (n: string) => string;
  // payment
  paymentMethod: string;
  discountCode: string;
  discountPlaceholder: string;
  apply: string;
  applied: string;
  discountPercentOff: (percent: string) => string;
  discountAmountOff: (amount: string) => string;
  discountFreeShipping: string;
  // review
  reviewTitle: string;
  reviewContact: string;
  reviewAddress: string;
  reviewShipping: string;
  reviewPayment: string;
  payNow: string;
  edit: string;
  // result
  paymentSuccess: string;
  paymentFailed: string;
  paymentPending: string;
  paymentPendingHint: string;
  orderNumber: string;
  orderId: string;
  orderConfirmedHint: string;
  orderDetails: string;
  orderItems: string;
  product: string;
  lineTotal: string;
  tryAgain: string;
  // status / errors
  loading: string;
  processing: string;
  redirecting: string;
}

const fa: Strings = {
  stepCart: 'سبد خرید',
  stepShipping: 'ارسال',
  stepPayment: 'پرداخت',
  stepReview: 'بازبینی',
  stepResult: 'پایان خرید',
  stepShippingInfo: 'اطلاعات ارسال',
  stepOf: (current, total) => `مرحله ${current} از ${total}`,
  next: 'ادامه',
  placeOrder: 'ثبت سفارش',
  saveShippingDetails: 'ثبت اطلاعات ارسال',
  continueToPayment: 'ادامه به پرداخت',
  finalizeOrder: 'نهایی‌سازی سفارش',
  finishPurchase: 'پایان خرید',
  back: 'بازگشت',
  continueShopping: 'ادامه خرید',
  orderSummary: 'خلاصه سفارش',
  subtotal: 'جمع کل',
  shipping: 'هزینه ارسال',
  discount: 'تخفیف',
  credit: 'اعتبار',
  vat: 'مالیات',
  total: 'مبلغ قابل پرداخت',
  totalAmount: 'مبلغ کل',
  free: 'رایگان',
  quantity: 'تعداد',
  optional: 'اختیاری',
  cartTitle: 'سبد خرید شما',
  cartEmpty: 'سبد خرید شما خالی است',
  cartEmptyHint: 'محصولات موردعلاقه را اضافه کنید تا اینجا ببینید.',
  remove: 'حذف',
  itemDiscount: (amount) => `${amount} تخفیف`,
  yourSavings: 'سود شما از این خرید',
  contactInfo: 'اطلاعات تماس',
  firstName: 'نام',
  lastName: 'نام خانوادگی',
  mobilePhone: 'شماره موبایل',
  email: 'ایمیل',
  phoneNumber: 'تلفن ثابت',
  region: 'استان',
  city: 'شهر',
  postalCode: 'کد پستی',
  addressLine: 'نشانی کامل',
  description: 'توضیحات',
  selectRegion: 'انتخاب استان',
  selectCity: 'انتخاب شهر',
  shippingMethod: 'روش ارسال',
  shippingMethods: 'روش‌های ارسال',
  shippingMethodsHint: 'پس از ثبت نشانی، روش‌های قابل استفاده نمایش داده می‌شوند.',
  digitalNoShipping: 'محصولات دیجیتال و خدمات',
  digitalNoShippingHint: 'این موارد به ارسال فیزیکی نیاز ندارند.',
  errorRequired: 'این فیلد اجباری است',
  errorMobilePhone: 'شماره موبایل معتبر وارد کنید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)',
  errorEmail: 'آدرس ایمیل معتبر نیست',
  changeTo: 'تغییر به',
  productCount: (n) => `${n} محصول`,
  paymentMethod: 'روش پرداخت',
  discountCode: 'کد تخفیف',
  discountPlaceholder: 'کد تخفیف را وارد کنید',
  apply: 'اعمال',
  applied: 'اعمال شد',
  discountPercentOff: (percent) => `${percent}٪ تخفیف`,
  discountAmountOff: (amount) => `${amount} تخفیف`,
  discountFreeShipping: 'ارسال رایگان',
  reviewTitle: 'بازبینی سفارش',
  reviewContact: 'مشخصات گیرنده',
  reviewAddress: 'آدرس ارسال',
  reviewShipping: 'روش ارسال',
  reviewPayment: 'روش پرداخت',
  payNow: 'پرداخت',
  edit: 'ویرایش',
  paymentSuccess: 'پرداخت با موفقیت انجام شد',
  paymentFailed: 'پرداخت ناموفق بود',
  paymentPending: 'در حال بررسی پرداخت',
  paymentPendingHint: 'پرداخت شما در حال پردازش است. لطفاً صبر کنید.',
  orderNumber: 'کد سفارش',
  orderId: 'شناسه سفارش',
  orderConfirmedHint: 'سفارش شما با موفقیت ثبت شد.',
  orderDetails: 'جزئیات سفارش',
  orderItems: 'اقلام سفارش',
  product: 'محصول',
  lineTotal: 'جمع قیمت',
  tryAgain: 'تلاش دوباره',
  loading: 'در حال بارگذاری…',
  processing: 'در حال پردازش…',
  redirecting: 'در حال انتقال به درگاه پرداخت…'
};

const en: Strings = {
  stepCart: 'Cart',
  stepShipping: 'Shipping',
  stepPayment: 'Payment',
  stepReview: 'Review',
  stepResult: 'Finish',
  stepShippingInfo: 'Shipping details',
  stepOf: (current, total) => `Step ${current} of ${total}`,
  next: 'Continue',
  placeOrder: 'Place order',
  saveShippingDetails: 'Save shipping details',
  continueToPayment: 'Continue to payment',
  finalizeOrder: 'Finalize order',
  finishPurchase: 'Finish purchase',
  back: 'Back',
  continueShopping: 'Continue shopping',
  orderSummary: 'Order Summary',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  discount: 'Discount',
  credit: 'Credit',
  vat: 'VAT',
  total: 'Total',
  totalAmount: 'Total amount',
  free: 'Free',
  quantity: 'Qty',
  optional: 'Optional',
  cartTitle: 'Your cart',
  cartEmpty: 'Your cart is empty',
  cartEmptyHint: 'Add a few items and they’ll show up here.',
  remove: 'Remove',
  itemDiscount: (amount) => `Save ${amount}`,
  yourSavings: 'Your savings',
  contactInfo: 'Contact information',
  firstName: 'First name',
  lastName: 'Last name',
  mobilePhone: 'Mobile phone',
  phoneNumber: 'Phone number',
  email: 'Email',
  region: 'Province',
  city: 'City',
  postalCode: 'Postal code',
  addressLine: 'Full address',
  description: 'Description',
  selectRegion: 'Select province',
  selectCity: 'Select city',
  shippingMethod: 'Shipping method',
  shippingMethods: 'Shipping methods',
  shippingMethodsHint: 'Available delivery options will appear after you save this address.',
  digitalNoShipping: 'Digital products and services',
  digitalNoShippingHint: 'These items do not require physical delivery.',
  errorRequired: 'This field is required',
  errorMobilePhone: 'Enter a valid mobile number (e.g. 09123456789)',
  errorEmail: 'Enter a valid email address',
  changeTo: 'Switch to',
  productCount: (n) => `${n} item(s)`,
  paymentMethod: 'Payment method',
  discountCode: 'Discount code',
  discountPlaceholder: 'Enter discount code',
  apply: 'Apply',
  applied: 'Applied',
  discountPercentOff: (percent) => `${percent}% off`,
  discountAmountOff: (amount) => `${amount} off`,
  discountFreeShipping: 'Free shipping',
  reviewTitle: 'Review your order',
  reviewContact: 'Recipient',
  reviewAddress: 'Shipping address',
  reviewShipping: 'Shipping method',
  reviewPayment: 'Payment method',
  payNow: 'Pay',
  edit: 'Edit',
  paymentSuccess: 'Payment completed successfully',
  paymentFailed: 'Payment failed',
  paymentPending: 'Verifying payment',
  paymentPendingHint: 'Your payment is being processed. Please wait.',
  orderNumber: 'Order code',
  orderId: 'Order ID',
  orderConfirmedHint: 'Your order is confirmed. Its details and purchased items are shown below.',
  orderDetails: 'Order details',
  orderItems: 'Order items',
  product: 'Product',
  lineTotal: 'Line total',
  tryAgain: 'Try again',
  loading: 'Loading…',
  processing: 'Processing…',
  redirecting: 'Redirecting to the payment gateway…'
};

const DICTS: Record<CheckoutLocale, Strings> = { fa, en };

export function strings(locale: CheckoutLocale): Strings {
  return DICTS[locale];
}

/** Visual family of a payment method — drives the icon shown in the UI. */
export type PaymentMethodKind = 'card' | 'cod' | 'bnpl' | 'wallet' | 'gateway' | 'free';

export interface PaymentMethodInfo {
  title: string;
  description: string;
  kind: PaymentMethodKind;
}

interface GatewayMeta {
  kind: PaymentMethodKind;
  title: Record<CheckoutLocale, string>;
}

/** Brand/title + family per gateway. Unlisted codes fall back to a generic online gateway. */
const GATEWAYS: Partial<Record<PaymentGateway, GatewayMeta>> = {
  cardtocardpayment: { kind: 'card', title: { fa: 'کارت به کارت', en: 'Card to card' } },
  paymentinplace: { kind: 'cod', title: { fa: 'پرداخت در محل', en: 'Pay on delivery' } },
  freepayment: { kind: 'free', title: { fa: 'پرداخت رایگان', en: 'Free' } },
  // BNPL / installment
  snapppayment: { kind: 'bnpl', title: { fa: 'اسنپ‌پی', en: 'SnappPay' } },
  torobpaypayment: { kind: 'bnpl', title: { fa: 'ترب‌پی', en: 'TorobPay' } },
  azkipayment: { kind: 'bnpl', title: { fa: 'ازکی‌وام', en: 'Azki' } },
  digipaypayment: { kind: 'bnpl', title: { fa: 'دیجی‌پی', en: 'DigiPay' } },
  tarapayment: { kind: 'bnpl', title: { fa: 'تارا', en: 'Tara' } },
  tomanpayment: { kind: 'bnpl', title: { fa: 'تومان', en: 'Toman' } },
  novapaypayment: { kind: 'bnpl', title: { fa: 'نوادپی', en: 'NovaPay' } },
  // wallets
  vandarpayment: { kind: 'wallet', title: { fa: 'کیف پول وندار', en: 'Vandar wallet' } },
  zarinpalpayment: { kind: 'wallet', title: { fa: 'زرین‌پال', en: 'ZarinPal' } },
  zarinpluspayment: { kind: 'wallet', title: { fa: 'زرین‌پلاس', en: 'ZarinPlus' } },
  paypingpayment: { kind: 'wallet', title: { fa: 'پی‌پینگ', en: 'PayPing' } }
};

const KIND_DESC: Record<PaymentMethodKind, Record<CheckoutLocale, string>> = {
  card: { fa: 'انتقال مستقیم به شماره‌کارت فروشنده', en: 'Transfer directly to the seller’s card' },
  cod: { fa: 'هنگام تحویل سفارش پرداخت کنید', en: 'Pay when your order is delivered' },
  bnpl: { fa: 'خرید اعتباری و پرداخت اقساطی', en: 'Buy now, pay later in installments' },
  wallet: { fa: 'پرداخت از موجودی کیف پول', en: 'Pay from your wallet balance' },
  gateway: { fa: 'انتقال امن به درگاه بانکی', en: 'Secure redirect to the bank gateway' },
  free: { fa: 'مبلغی برای پرداخت وجود ندارد', en: 'Nothing to pay for this order' }
};

const FALLBACK_TITLE: Record<CheckoutLocale, string> = { fa: 'پرداخت آنلاین', en: 'Online payment' };

/** Human label for a payment gateway code. Online gateways fall back generically. */
export function paymentMethodLabel(code: PaymentGateway, locale: CheckoutLocale): string {
  return GATEWAYS[code]?.title[locale] ?? FALLBACK_TITLE[locale];
}

/** Title + description + visual family for a payment gateway code. */
export function paymentMethodInfo(code: PaymentGateway, locale: CheckoutLocale): PaymentMethodInfo {
  const meta = GATEWAYS[code];
  const kind = meta?.kind ?? 'gateway';
  return {
    title: meta?.title[locale] ?? FALLBACK_TITLE[locale],
    description: KIND_DESC[kind][locale],
    kind
  };
}
