export type CheckoutAttributeValue = string | {
  value: string;
  extra?: string;
  fieldType?: string;
};

const HEX_COLOR_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function attributeValueToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const nestedValue = (value as Record<string, unknown>).value;
    return nestedValue == null ? '' : String(nestedValue);
  }
  return String(value);
}

function toHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed)
    ? (trimmed.startsWith('#') ? trimmed : `#${trimmed}`)
    : null;
}

/** Read a color swatch from a raw value or rich color metadata. */
export function attributeHexColor(value: unknown): string | null {
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    return toHexColor(objectValue.extra) ?? toHexColor(objectValue.value);
  }
  return toHexColor(value);
}

/** Display the label of an attribute without coercing rich values to [object Object]. */
export function formatAttributeValue(value: CheckoutAttributeValue): string {
  return typeof value === 'string' ? value : value.value;
}

export function formatAttribute(attribute: {
  name: string;
  value: CheckoutAttributeValue;
}): string {
  return `${attribute.name}: ${formatAttributeValue(attribute.value)}`;
}
