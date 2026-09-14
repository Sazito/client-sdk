import { describe, expect, it } from 'vitest';
import { formatAttribute, formatAttributeValue } from '../src/ui/attribute-utils';

describe('attribute display formatting', () => {
  it('uses the human-readable value from rich attributes', () => {
    const value = { value: 'مشکی', extra: '#111111', fieldType: 'color' };

    expect(formatAttributeValue(value)).toBe('مشکی');
    expect(formatAttribute({ name: 'رنگ', value })).toBe('رنگ: مشکی');
  });

  it('keeps plain string attributes unchanged', () => {
    expect(formatAttribute({ name: 'Color', value: 'Black' })).toBe('Color: Black');
  });
});
