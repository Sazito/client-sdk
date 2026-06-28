/**
 * Error taxonomy + mapping from SDK responses to typed checkout errors.
 */
import type { SazitoResponse } from '@sazito/client-sdk';
import type { CheckoutError, CheckoutErrorCode, CheckoutLocale, CheckoutStep } from './types';

type SdkError = NonNullable<SazitoResponse<unknown>['error']>;

/** Map an HTTP status (per SALES_FLOW docs) to a checkout error code. */
function codeForStatus(status?: number): CheckoutErrorCode | undefined {
  switch (status) {
    case 416:
      return 'min_basket';
    case 418:
      return 'rate_limited';
    case 422:
      return 'cart_invalid';
    case 423:
      return 'invoice_locked';
    default:
      return undefined;
  }
}

const MESSAGES: Record<CheckoutErrorCode, Record<CheckoutLocale, string>> = {
  no_cart: {
    fa: 'سبد خریدی یافت نشد. لطفاً ابتدا یک سبد خرید ایجاد کنید.',
    en: 'No cart found. Please create a cart first.'
  },
  no_invoice: {
    fa: 'فاکتوری یافت نشد.',
    en: 'No invoice found.'
  },
  min_basket: {
    fa: 'حداقل مبلغ سبد خرید رعایت نشده است.',
    en: 'Minimum basket amount not reached.'
  },
  rate_limited: {
    fa: 'درخواست‌های زیادی ارسال شد. کمی صبر کنید.',
    en: 'Too many requests. Please wait a moment.'
  },
  cart_invalid: {
    fa: 'سبد خرید نامعتبر است و بازنشانی شد.',
    en: 'Cart is invalid and was reset.'
  },
  invoice_locked: {
    fa: 'فاکتور قفل شده است. لطفاً صفحه را بازخوانی کنید.',
    en: 'Invoice is locked. Please reload the page.'
  },
  stock_violated: {
    fa: 'موجودی برخی از محصولات سبد خرید رزرو شده یا کافی نیست.',
    en: 'Some products are out of stock or reserved.'
  },
  shipping_required: {
    fa: 'لطفاً روش ارسال را انتخاب کنید.',
    en: 'Please select a shipping method.'
  },
  address_required: {
    fa: 'لطفاً اطلاعات ارسال را کامل وارد کنید.',
    en: 'Please complete the shipping information.'
  },
  payment_failed: {
    fa: 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.',
    en: 'Payment failed. Please try again.'
  },
  network: {
    fa: 'خطای ارتباط با سرور. لطفاً دوباره تلاش کنید.',
    en: 'Network error. Please try again.'
  },
  validation: {
    fa: 'اطلاعات واردشده نامعتبر است.',
    en: 'The provided information is invalid.'
  },
  unknown: {
    fa: 'خطای ناشناخته‌ای رخ داد.',
    en: 'An unexpected error occurred.'
  }
};

export function messageForCode(code: CheckoutErrorCode, locale: CheckoutLocale): string {
  return MESSAGES[code][locale];
}

export function fromSdkError(
  error: SdkError,
  locale: CheckoutLocale,
  step?: CheckoutStep
): CheckoutError {
  const code =
    codeForStatus(error.status) ??
    (error.type === 'network' ? 'network' : error.type === 'validation' ? 'validation' : 'unknown');

  // Prefer the server message when present, otherwise the localized default.
  const message = error.message?.trim() || messageForCode(code, locale);
  return { message, code, status: error.status, step };
}

export function makeError(
  code: CheckoutErrorCode,
  locale: CheckoutLocale,
  step?: CheckoutStep
): CheckoutError {
  return { message: messageForCode(code, locale), code, step };
}
