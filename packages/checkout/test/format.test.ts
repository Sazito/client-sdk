import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  formatNumber,
  formatPrice,
  normalizeIranianPhone,
  toEnglishDigits,
  toPersianDigits
} from '../src/core/format';

describe('format', () => {
  it('groups numbers in en locale', () => {
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
  });

  it('uses Persian digits in fa locale', () => {
    expect(formatNumber(1200, 'fa')).toBe(toPersianDigits('1,200'));
    expect(formatNumber(1200, 'fa')).toBe('۱,۲۰۰');
  });

  it('appends a currency label', () => {
    expect(formatMoney(1000, 'en', 'Toman')).toBe('1,000 Toman');
    expect(formatMoney(1000, 'fa')).toBe(`${toPersianDigits('1,000')} تومان`);
  });

  it('renders zero as Free', () => {
    expect(formatPrice(0, 'en')).toBe('Free');
    expect(formatPrice(0, 'fa')).toBe('رایگان');
    expect(formatPrice(500, 'en', 'Toman')).toBe('500 Toman');
  });

  it('normalizes Persian and Arabic-Indic phone digits', () => {
    expect(toEnglishDigits('۰۹۱۲٣٤٥٦٧٨۹')).toBe('09123456789');
    expect(normalizeIranianPhone('+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹')).toBe('09123456789');
  });
});
