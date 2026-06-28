/**
 * Locale-aware number / currency formatting.
 * Amounts are integer Toman values from the Sazito API.
 */
import type { CheckoutLocale } from './types';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const value = code >= 0x06f0 ? code - 0x06f0 : code - 0x0660;
    return String(value);
  });
}

export function formatNumber(value: number, locale: CheckoutLocale): string {
  const grouped = Math.round(value || 0).toLocaleString('en-US');
  return locale === 'fa' ? toPersianDigits(grouped) : grouped;
}

/**
 * Format a percentage with up to `maxDecimals` digits, trimming trailing zeros.
 * Keeps small fractions visible (e.g. 0.02%) where `formatNumber` would round to 0.
 */
export function formatPercent(value: number, locale: CheckoutLocale, maxDecimals = 2): string {
  const safe = value || 0;
  const rounded = Number(safe.toFixed(maxDecimals));
  const text = String(rounded);
  return locale === 'fa' ? toPersianDigits(text) : text;
}

export function defaultCurrencyLabel(locale: CheckoutLocale): string {
  return locale === 'fa' ? 'تومان' : 'Toman';
}

export function formatMoney(
  value: number,
  locale: CheckoutLocale,
  currencyLabel?: string
): string {
  const label = currencyLabel ?? defaultCurrencyLabel(locale);
  return `${formatNumber(value, locale)} ${label}`;
}

/**
 * Normalize an Iranian phone number to the 11-digit 0XXXXXXXXXX format.
 * Accepts: 09..., +989..., 00989..., 989..., 9... (10 digits without leading 0)
 */
export function normalizeIranianPhone(raw: string): string {
  let s = toEnglishDigits(raw).replace(/[\s\-().]/g, '');
  if (s.startsWith('+98')) s = '0' + s.slice(3);
  else if (s.startsWith('0098')) s = '0' + s.slice(4);
  else if (/^98\d{9}$/.test(s)) s = '0' + s.slice(2);
  else if (/^9\d{9}$/.test(s)) s = '0' + s;
  return s;
}

export function isValidIranianPhone(s: string): boolean {
  return /^0[0-9]{10}$/.test(s);
}

export function isValidIranianMobile(s: string): boolean {
  return /^09[0-9]{9}$/.test(s);
}

/** Free price shown when a rate / delivery costs nothing. */
export function formatPrice(
  value: number,
  locale: CheckoutLocale,
  currencyLabel?: string
): string {
  if (!value || value <= 0) {
    return locale === 'fa' ? 'رایگان' : 'Free';
  }
  return formatMoney(value, locale, currencyLabel);
}
